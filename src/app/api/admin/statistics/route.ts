import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'

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

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1)

    const [totalRegistrations, verifiedRegistrations, unverifiedRegistrations, registrationsToday, registrationsThisMonth] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { isVerified: true } }),
      prisma.registration.count({ where: { isVerified: false } }),
      prisma.registration.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.registration.count({ where: { createdAt: { gte: startOfMonth } } })
    ])

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: { allocations: { where: { isActive: true } } },
      orderBy: { name: 'asc' }
    })

    const allocationsCount = await prisma.roomAllocation.count({ where: { isActive: true } })

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const occupiedSpaces = allocationsCount
    const availableSpaces = Math.max(totalCapacity - occupiedSpaces, 0)
    const utilizationRate = totalCapacity > 0 ? Math.round((occupiedSpaces / totalCapacity) * 100) : 0

    const occupiedRooms = rooms.filter(r => r.allocations.length > 0).length
    const availableRooms = rooms.filter(r => r.allocations.length < r.capacity).length

    const maleRooms = rooms.filter(r => r.gender === 'Male').length
    const femaleRooms = rooms.filter(r => r.gender === 'Female').length

    const maleRegistrations = await prisma.registration.count({ where: { gender: 'Male' } })
    const femaleRegistrations = await prisma.registration.count({ where: { gender: 'Female' } })

    return NextResponse.json({
      success: true,
      statistics: {
        registrations: {
          total: totalRegistrations,
          verified: verifiedRegistrations,
          unverified: unverifiedRegistrations,
          allocated: allocationsCount,
          unallocated: Math.max(totalRegistrations - allocationsCount, 0),
          allocationRate: totalRegistrations > 0 ? Math.round((allocationsCount / totalRegistrations) * 100) : 0,
          byGender: { male: maleRegistrations, female: femaleRegistrations },
          recent: { today: registrationsToday, thisMonth: registrationsThisMonth, thisWeek: 0 },
          permissions: { granted: 0, pending: 0 }
        },
        rooms: {
          total: rooms.length,
          active: rooms.length,
          byGender: { male: maleRooms, female: femaleRooms },
          capacity: { total: totalCapacity, occupied: occupiedSpaces, available: availableSpaces, utilizationRate }
        },
        allocations: { total: allocationsCount, byGender: { male: 0, female: 0 } },
        summary: { occupiedRooms, availableRooms }
      }
    })
  } catch (error) {
    console.error('Error generating admin statistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}