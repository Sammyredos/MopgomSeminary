import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'

const prisma = new PrismaClient()

function calculateAge(dob: Date): number {
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--
  }
  return age
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    const currentUser = authResult.user!
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { registrationId, roomId } = body || {}
    if (!registrationId || !roomId) {
      return NextResponse.json({ error: 'registrationId and roomId are required' }, { status: 400 })
    }

    const [registration, room] = await Promise.all([
      prisma.registration.findUnique({ where: { id: registrationId } }),
      prisma.room.findUnique({ where: { id: roomId }, include: { allocations: { include: { registration: true } } } })
    ])

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }
    if (!room || !room.isActive) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 })
    }

    // Ensure not already allocated
    const existingAllocation = await prisma.roomAllocation.findUnique({ where: { registrationId } })
    if (existingAllocation) {
      return NextResponse.json({ error: 'Registration is already allocated to a room' }, { status: 400 })
    }

    // Gender check
    if (room.gender !== registration.gender) {
      return NextResponse.json({ error: 'Room gender does not match registration gender' }, { status: 400 })
    }

    // Capacity check
    const occupancy = room.allocations.length
    if (occupancy >= room.capacity) {
      return NextResponse.json({ error: 'Room is at full capacity' }, { status: 400 })
    }

    // Age gap check using settings
    const setting = await prisma.setting.findUnique({ where: { category_key: { category: 'accommodations', key: 'ageGapYears' } } })
    const ageGap = setting ? Number(setting.value) : 3
    const regAge = calculateAge(registration.dateOfBirth)
    const violatesAgeGap = room.allocations.some(a => {
      const otherAge = calculateAge(a.registration.dateOfBirth)
      return Math.abs(otherAge - regAge) > ageGap
    })
    if (violatesAgeGap) {
      return NextResponse.json({ error: `Age gap exceeds allowed ${ageGap} years for this room` }, { status: 400 })
    }

    const allocation = await prisma.roomAllocation.create({
      data: {
        registrationId,
        roomId,
        allocatedBy: currentUser.email || currentUser.name || 'system',
        isActive: true
      },
      include: { room: true }
    })

    return NextResponse.json({ success: true, allocation, message: 'Allocation created successfully' })
  } catch (error) {
    console.error('Error creating allocation:', error)
    return NextResponse.json({ error: 'Failed to allocate room' }, { status: 500 })
  }
}