import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { checkRegistrationCompletion } from '@/utils/registrationCompletion'
import { generateMatriculationNumber } from '@/lib/matriculation-generator'

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

    // Persist all profile fields before verification
    const schoolsAttendedStr = Array.isArray(body.schoolsAttended)
      ? JSON.stringify(body.schoolsAttended)
      : (registration as any).schoolsAttended ?? null

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        fullName: (body.name ?? registration.fullName) as string,
        address: (body.homeAddress ?? registration.address) as string,
        courseDesired: (body.courseDesired ?? registration.courseDesired) || undefined,
        officePostalAddress: body.officePostalAddress ?? (registration as any).officePostalAddress ?? null,
        maritalStatus: body.maritalStatus ?? (registration as any).maritalStatus ?? null,
        spouseName: body.spouseName ?? (registration as any).spouseName ?? null,
        placeOfBirth: body.placeOfBirth ?? (registration as any).placeOfBirth ?? null,
        origin: body.origin ?? (registration as any).origin ?? null,
        presentOccupation: body.presentOccupation ?? (registration as any).presentOccupation ?? null,
        placeOfWork: body.placeOfWork ?? (registration as any).placeOfWork ?? null,
        positionHeldInOffice: body.positionHeldInOffice ?? (registration as any).positionHeldInOffice ?? null,
        acceptedJesusChrist: typeof body.acceptedJesusChrist === 'boolean' 
          ? body.acceptedJesusChrist 
          : (registration as any).acceptedJesusChrist ?? null,
        whenAcceptedJesus: body.whenAcceptedJesus ?? (registration as any).whenAcceptedJesus ?? null,
        churchAffiliation: body.churchAffiliation ?? (registration as any).churchAffiliation ?? null,
        schoolsAttended: schoolsAttendedStr,
        updatedAt: new Date()
      }
    })

    // Recompute completion from the saved record for consistency
    const completionStatus = checkRegistrationCompletion({
      name: updated.fullName,
      email: updated.emailAddress,
      phone: updated.phoneNumber,
      dateOfBirth: updated.dateOfBirth as any,
      gender: updated.gender,
      homeAddress: updated.address,
      officePostalAddress: (updated as any).officePostalAddress || '',
      maritalStatus: (updated as any).maritalStatus || '',
      spouseName: (updated as any).spouseName || '',
      placeOfBirth: (updated as any).placeOfBirth || '',
      origin: (updated as any).origin || '',
      presentOccupation: (updated as any).presentOccupation || '',
      placeOfWork: (updated as any).placeOfWork || '',
      positionHeldInOffice: (updated as any).positionHeldInOffice || '',
      acceptedJesusChrist: (updated as any).acceptedJesusChrist ?? undefined,
      whenAcceptedJesus: (updated as any).whenAcceptedJesus || '',
      churchAffiliation: (updated as any).churchAffiliation || '',
      schoolsAttended: (() => {
        const raw = (updated as any).schoolsAttended as string | null
        try { return raw ? JSON.parse(raw) : [] } catch { return [] }
      })(),
      courseDesired: updated.courseDesired || ''
    })

    if (!completionStatus.isComplete) {
      return NextResponse.json({ success: false, verified: false, message: 'Profile is incomplete' }, { status: 400 })
    }

    if (updated.isVerified) {
      return NextResponse.json({ success: true, verified: true, verifiedAt: (updated as any).verifiedAt, verifiedBy: (updated as any).verifiedBy })
    }

    // Generate matriculation number only when profile is complete and being verified
    const matriculationNumber = await generateMatriculationNumber()

    const verified = await prisma.registration.update({
      where: { id: updated.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: user.email || null,
        matriculationNumber: matriculationNumber // Assign matriculation number upon verification
      }
    })

    // Sync matriculation number to student record for admin visibility
    try {
      if (updated.matriculationNumber !== undefined) {
        await prisma.student.updateMany({
          where: {
            OR: [
              { emailAddress: updated.emailAddress },
              { phoneNumber: updated.phoneNumber }
            ]
          },
          data: {
            matriculationNumber: updated.matriculationNumber || null
          }
        })
      }
    } catch (syncErr) {
      console.warn('Student matriculation sync in verify failed:', syncErr)
    }

    return NextResponse.json({ success: true, verified: true, verifiedAt: (verified as any).verifiedAt, verifiedBy: (verified as any).verifiedBy })
  } catch (error) {
    console.error('Student verify error:', error)
    return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 })
  }
}