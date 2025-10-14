import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    const currentUser = authResult.user!
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { registrationId } = await params

    const allocation = await prisma.roomAllocation.findUnique({
      where: { registrationId },
      include: {
        room: true,
        registration: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
            emailAddress: true
          }
        }
      }
    })

    if (!allocation) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, allocation })
  } catch (error) {
    console.error('Error fetching allocation:', error)
    return NextResponse.json({ error: 'Failed to fetch allocation' }, { status: 500 })
  }
}