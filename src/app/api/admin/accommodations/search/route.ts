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

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || searchParams.get('query') || '').trim()
    const limit = Number(searchParams.get('limit') || 50)

    const where = q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { phoneNumber: { contains: q, mode: 'insensitive' } },
            { emailAddress: { contains: q, mode: 'insensitive' } },
            { branch: { contains: q, mode: 'insensitive' } }
          ]
        }
      : {}

    const registrants = await prisma.registration.findMany({
      where,
      take: Math.min(Math.max(limit, 1), 200),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        emailAddress: true,
        roomAllocation: {
          include: {
            room: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, results: registrants })
  } catch (error) {
    console.error('Error searching accommodations:', error)
    return NextResponse.json({ error: 'Failed to search registrations' }, { status: 500 })
  }
}