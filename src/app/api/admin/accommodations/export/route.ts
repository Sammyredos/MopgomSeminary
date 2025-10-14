import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'

const prisma = new PrismaClient()

function toCsv(rows: any[]): string {
  const headers = ['Full Name', 'Gender', 'Date of Birth', 'Phone Number', 'Email Address', 'Room Name']
  const lines = [headers.join(',')]
  for (const r of rows) {
    const roomName = r.roomAllocation?.room?.name || ''
    const dob = new Date(r.dateOfBirth).toISOString().slice(0, 10)
    lines.push([
      r.fullName,
      r.gender,
      dob,
      r.phoneNumber,
      r.emailAddress,
      roomName
    ].map(v => typeof v === 'string' ? '"' + v.replace(/"/g, '""') + '"' : v).join(','))
  }
  return lines.join('\n')
}

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
    const q = (searchParams.get('q') || '').trim()
    const format = (searchParams.get('format') || 'csv').toLowerCase()

    const where = q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { phoneNumber: { contains: q, mode: 'insensitive' } },
            { emailAddress: { contains: q, mode: 'insensitive' } }
          ]
        }
      : {}

    const registrants = await prisma.registration.findMany({
      where,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        emailAddress: true,
        roomAllocation: { include: { room: true } }
      }
    })

    if (format === 'csv') {
      const csv = toCsv(registrants)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="accommodations_export.csv"'
        }
      })
    }

    return NextResponse.json({ error: 'PDF export not implemented' }, { status: 501 })
  } catch (error) {
    console.error('Error exporting accommodations:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}