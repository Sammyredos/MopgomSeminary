import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { checkRegistrationCompletion } from '@/utils/registrationCompletion'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.adminId },
      include: { role: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }
    if (user.role?.name !== 'Student') {
      return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    const registration = await prisma.registration.findFirst({
      where: { emailAddress: user.email },
      orderBy: { createdAt: 'desc' }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found for user' }, { status: 404 })
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        fullName: (body.name ?? registration.fullName) as string,
        address: (body.homeAddress ?? registration.address) as string,
        courseDesired: (body.courseDesired ?? registration.courseDesired) || undefined,
        updatedAt: new Date()
      }
    })

    const completionStatus = checkRegistrationCompletion({
      name: updated.fullName,
      email: updated.emailAddress,
      phone: updated.phoneNumber,
      dateOfBirth: updated.dateOfBirth as any,
      gender: updated.gender,
      homeAddress: updated.address,
      officePostalAddress: (body.officePostalAddress ?? (registration as any).officePostalAddress) || '',
      maritalStatus: (body.maritalStatus ?? (registration as any).maritalStatus) || '',
      spouseName: (body.spouseName ?? (registration as any).spouseName) || '',
      placeOfBirth: (body.placeOfBirth ?? (registration as any).placeOfBirth) || '',
      origin: (body.origin ?? (registration as any).origin) || '',
      presentOccupation: (body.presentOccupation ?? (registration as any).presentOccupation) || '',
      placeOfWork: (body.placeOfWork ?? (registration as any).placeOfWork) || '',
      positionHeldInOffice: (body.positionHeldInOffice ?? (registration as any).positionHeldInOffice) || '',
      acceptedJesusChrist: typeof body.acceptedJesusChrist === 'boolean' ? body.acceptedJesusChrist : (registration as any).acceptedJesusChrist,
      whenAcceptedJesus: (body.whenAcceptedJesus ?? (registration as any).whenAcceptedJesus) || '',
      churchAffiliation: (body.churchAffiliation ?? (registration as any).churchAffiliation) || '',
      schoolsAttended: Array.isArray(body.schoolsAttended) ? body.schoolsAttended : (() => {
        const raw = (registration as any).schoolsAttended as string | null
        try { return raw ? JSON.parse(raw) : [] } catch { return [] }
      })(),
      courseDesired: updated.courseDesired || ''
    })

    if (!completionStatus.isComplete) {
      return NextResponse.json({ success: false, verified: false, message: 'Profile is incomplete' }, { status: 400 })
    }

    if (registration.isVerified) {
      return NextResponse.json({ success: true, verified: true, verifiedAt: registration.verifiedAt, verifiedBy: registration.verifiedBy })
    }

    const verified = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: user.email || null
      }
    })

    return NextResponse.json({ success: true, verified: true, verifiedAt: verified.verifiedAt, verifiedBy: verified.verifiedBy })
  } catch (error) {
    console.error('Student verify error:', error)
    return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 })
  }
}