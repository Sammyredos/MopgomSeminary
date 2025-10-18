/**
 * Attendance Verification API
 * POST /api/admin/attendance/verify
 * 
 * Verifies a registrant's attendance and marks them as verified for room allocation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'
import { Logger } from '@/lib/logger'
import { broadcastAttendanceEvent } from '../events/route'
import { sendVerificationConfirmationEmail } from '@/lib/email'

const logger = Logger('AttendanceVerification')

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check if user has permission to verify attendance
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager', 'Student', 'Staff'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()
    const { method, registrationId } = data

    let registration

    if (method === 'manual' && registrationId) {
      // Manual verification by registration ID
      registration = await prisma.registration.findUnique({
        where: { id: registrationId }
      })

      if (!registration) {
        return NextResponse.json({
          error: 'Registration not found'
        }, { status: 404 })
      }

    } else {
      return NextResponse.json({
        error: 'Invalid verification method. Use "manual" with registrationId'
      }, { status: 400 })
    }

    // Check if already verified
    if (registration.isVerified) {
      return NextResponse.json({
        error: 'Registration is already verified',
        registration: {
          id: registration.id,
          fullName: registration.fullName,
          isVerified: registration.isVerified,
          verifiedAt: registration.verifiedAt,
          verifiedBy: registration.verifiedBy
        }
      }, { status: 400 })
    }

    // Mark as verified
    const updatedRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: currentUser.email,
        // attendanceMarked and attendanceTime removed: not present in schema
      }
    })



    logger.info('Registration verified successfully', {
      registrationId: registration.id,
      fullName: registration.fullName,
      method,
      verifiedBy: currentUser.email
    })

    // Send verification confirmation email to participant
    console.log(`📧 Attempting to send verification email to: ${registration.emailAddress}`)
    console.log(`🔧 Verification method: ${method}`)

    try {
      const emailResult = await sendVerificationConfirmationEmail(updatedRegistration)

      console.log(`📧 Email send result:`, emailResult)

      if (emailResult.success) {
        logger.info('Verification confirmation email sent successfully', {
          registrationId: registration.id,
          participantEmail: registration.emailAddress,
          verificationMethod: method,
          verifiedBy: currentUser.email
        })
        console.log(`✅ Verification email sent successfully to: ${registration.emailAddress}`)
      } else {
        logger.warn('Failed to send verification confirmation email', {
          registrationId: registration.id,
          participantEmail: registration.emailAddress,
          verificationMethod: method,
          error: emailResult.error,
          verifiedBy: currentUser.email
        })
        console.error(`❌ Verification email failed for: ${registration.emailAddress}`, emailResult.error)
      }
    } catch (emailError) {
      logger.error('Error sending verification confirmation email', {
        registrationId: registration.id,
        participantEmail: registration.emailAddress,
        verificationMethod: method,
        error: emailError,
        verifiedBy: currentUser.email
      })
      console.error(`❌ Verification email exception for: ${registration.emailAddress}`, emailError)
      // Don't fail the verification if email sending fails
    }

    // Small delay to ensure database transaction is committed before broadcasting
    await new Promise(resolve => setTimeout(resolve, 50))

    // Broadcast real-time event to all connected clients
    broadcastAttendanceEvent({
      type: 'verification',
      data: {
        registrationId: registration.id,
        fullName: registration.fullName,
        status: 'present',
        timestamp: new Date().toISOString(),
        scannerName: currentUser.email,
        // platoonName removed: Registration has no platoon relation
        // roomName removed: not included in query and optional
      }
    })

    logger.info('Real-time event broadcasted for verification', {
      registrationId: registration.id,
      fullName: registration.fullName
    })

    return NextResponse.json({
      success: true,
      message: 'Registration verified successfully',
      registration: {
        id: updatedRegistration.id,
        fullName: updatedRegistration.fullName,
        gender: updatedRegistration.gender,
        dateOfBirth: updatedRegistration.dateOfBirth,
        phoneNumber: updatedRegistration.phoneNumber,
        emailAddress: updatedRegistration.emailAddress,
        isVerified: updatedRegistration.isVerified,
        verifiedAt: updatedRegistration.verifiedAt,
        verifiedBy: updatedRegistration.verifiedBy,
        // attendanceMarked and attendanceTime removed
      }
    })

  } catch (error) {
    logger.error('Error in attendance verification', error)
    return NextResponse.json(
      { error: 'Failed to verify attendance' },
      { status: 500 }
    )
  }
}

// Get verification status
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check permissions
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager', 'Student', 'Staff'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get('registrationId')

    if (!registrationId) {
      return NextResponse.json({
        error: 'Registration ID is required'
      }, { status: 400 })
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        emailAddress: true,
        isVerified: true,
        verifiedAt: true,
        verifiedBy: true,
        // attendanceMarked and attendanceTime removed from select
        roomAllocation: {
          include: {
            room: {
              select: {
                id: true,
                name: true,
                gender: true,
                capacity: true
              }
            }
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json({
        error: 'Registration not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      registration
    })

  } catch (error) {
    logger.error('Error getting verification status', error)
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    )
  }
}
