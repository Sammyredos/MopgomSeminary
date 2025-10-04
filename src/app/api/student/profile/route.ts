import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user info first
    const user = await prisma.user.findUnique({
      where: { id: payload.adminId },
      include: {
        role: true
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    // Check if user is a student
    if (user.role?.name !== 'Student') {
      return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
    }

    // Get registration data for the student
    const registration = await prisma.registration.findFirst({
      where: { 
        emailAddress: user.email 
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent registration
      }
    })

    if (!registration) {
      // Return basic user data if no registration found
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phoneNumber || null,
          dateOfBirth: null,
          gender: null,
          address: null,
          grade: null,
          currentClass: null,
          courseDesired: null,
          academicYear: null,
          parentGuardianName: null,
          parentGuardianPhone: null,
          parentGuardianEmail: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          emergencyContactRelationship: null,
          profilePicture: null,
          status: user.isActive ? 'Active' : 'Inactive',
          createdAt: user.createdAt
        }
      })
    }

    // Return complete profile data with registration information
    return NextResponse.json({
      user: {
        id: user.id,
        name: registration.fullName,
        email: registration.emailAddress,
        phone: registration.phoneNumber,
        dateOfBirth: registration.dateOfBirth,
        gender: registration.gender,
        address: registration.address,
        grade: registration.grade || null,
        currentClass: registration.currentClass || null,
        courseDesired: registration.courseDesired || null,
        academicYear: registration.academicYear || new Date().getFullYear().toString(),
        matriculationNumber: registration.matriculationNumber,
        parentGuardianName: registration.parentGuardianName,
        parentGuardianPhone: registration.parentGuardianPhone,
        parentGuardianEmail: registration.parentGuardianEmail,
        emergencyContactName: registration.emergencyContactName,
        emergencyContactPhone: registration.emergencyContactPhone,
        emergencyContactRelationship: registration.emergencyContactRelationship,
        profilePicture: null, // Can be added later if needed
        status: user.isActive ? 'Active' : 'Inactive',
        createdAt: registration.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}