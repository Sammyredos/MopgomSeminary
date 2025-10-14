import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    const currentUser = authResult.user!
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch rooms with allocations
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: {
        allocations: true
      },
      orderBy: { name: 'asc' }
    })

    // Fetch registrations and allocations
    const totalRegistrations = await prisma.registration.count()
    const allocationsCount = await prisma.roomAllocation.count({ where: { isActive: true } })
    const unallocatedRegistrations = await prisma.registration.findMany({
      where: { roomAllocation: null },
      select: { id: true, fullName: true, gender: true }
    })

    // Calculate stats
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const occupiedSpaces = allocationsCount
    const availableSpaces = Math.max(totalCapacity - occupiedSpaces, 0)
    const allocatedRegistrations = allocationsCount
    const unallocatedCount = totalRegistrations - allocatedRegistrations
    const allocationRate = totalRegistrations > 0 ? Math.round((allocatedRegistrations / totalRegistrations) * 100) : 0

    const roomsByGender: Record<string, typeof rooms> = {
      Male: rooms.filter(r => r.gender === 'Male'),
      Female: rooms.filter(r => r.gender === 'Female')
    }

    const unallocatedByGender: Record<string, typeof unallocatedRegistrations> = {
      Male: unallocatedRegistrations.filter(r => r.gender === 'Male'),
      Female: unallocatedRegistrations.filter(r => r.gender === 'Female')
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistrations,
        allocatedRegistrations,
        unallocatedRegistrations: unallocatedCount,
        allocationRate,
        totalRooms: rooms.length,
        activeRooms: rooms.length,
        totalCapacity,
        occupiedSpaces,
        availableSpaces
      },
      roomsByGender,
      unallocatedByGender
    })
  } catch (error) {
    console.error('Error fetching accommodations stats:', error)
    return NextResponse.json({ error: 'Failed to fetch accommodations' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    const currentUser = authResult.user!
    if (!['Super Admin', 'Admin', 'Manager'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get('registrationId')
    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId is required' }, { status: 400 })
    }

    const allocation = await prisma.roomAllocation.findUnique({ where: { registrationId } })
    if (!allocation) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
    }

    await prisma.roomAllocation.delete({ where: { id: allocation.id } })

    return NextResponse.json({ success: true, message: 'Allocation removed successfully' })
  } catch (error) {
    console.error('Error deleting allocation:', error)
    return NextResponse.json({ error: 'Failed to delete allocation' }, { status: 500 })
  }
}