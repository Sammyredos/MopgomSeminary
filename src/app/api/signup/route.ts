import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { withDynamicRateLimit } from '@/lib/rate-limiter'
import { sendWelcomeEmail } from '@/lib/email'
import { generateMatriculationNumber } from '@/lib/matriculation-generator'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await withDynamicRateLimit(request, 'registrations')
    if (rateLimitResponse) return rateLimitResponse

    const data = await request.json()

    // Validate required fields
    const requiredFields = ['firstname', 'lastname', 'email', 'password', 'dateOfBirth', 'gender', 'phone']
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Password validation
    if (data.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Comprehensive duplication checking
    const fullName = `${data.surname} ${data.firstname} ${data.lastname}`.toLowerCase().trim()
    const normalizedEmail = data.email.toLowerCase().trim()
    const normalizedPhone = data.phone.trim()
    const normalizedSurname = data.surname.toLowerCase().trim()
    const normalizedFirstname = data.firstname.toLowerCase().trim()
    const normalizedLastname = data.lastname.toLowerCase().trim()

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Check for duplicates in users table
    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phoneNumber: normalizedPhone },
          { 
            name: {
              equals: fullName
            }
          }
        ]
      }
    })

    if (duplicateUser) {
      let errorMessage = 'A user account already exists with this '
      if (duplicateUser.email === normalizedEmail) {
        errorMessage += 'email address'
      } else if (duplicateUser.phoneNumber === normalizedPhone) {
        errorMessage += 'phone number'
      } else {
        errorMessage += 'name'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // Check for duplicates in registrations table
    const duplicateRegistration = await prisma.registration.findFirst({
      where: {
        OR: [
          { emailAddress: normalizedEmail },
          { phoneNumber: normalizedPhone },
          { 
            fullName: {
              equals: fullName
            }
          }
        ]
      }
    })

    if (duplicateRegistration) {
      let errorMessage = 'A registration already exists with this '
      if (duplicateRegistration.emailAddress === normalizedEmail) {
        errorMessage += 'email address'
      } else if (duplicateRegistration.phoneNumber === normalizedPhone) {
        errorMessage += 'phone number'
      } else {
        errorMessage += 'name'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // Additional check for similar name combinations to prevent variations
    const similarNameCheck = await prisma.user.findFirst({
      where: {
        OR: [
          {
            AND: [
              { name: { contains: normalizedFirstname } },
              { name: { contains: normalizedLastname } }
            ]
          },
          {
            AND: [
              { name: { contains: normalizedSurname } },
              { name: { contains: normalizedFirstname } }
            ]
          }
        ]
      }
    })

    const similarRegistrationCheck = await prisma.registration.findFirst({
      where: {
        OR: [
          {
            AND: [
              { fullName: { contains: normalizedFirstname } },
              { fullName: { contains: normalizedLastname } }
            ]
          },
          {
            AND: [
              { fullName: { contains: normalizedSurname } },
              { fullName: { contains: normalizedFirstname } }
            ]
          }
        ]
      }
    })

    if (similarNameCheck || similarRegistrationCheck) {
      return NextResponse.json(
        { error: 'A similar name combination already exists. Please verify your information or contact support if this is an error.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Calculate age
    const dateOfBirth = new Date(data.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--
    }

    // Get the Student role (create if it doesn't exist)
    let studentRole = await prisma.role.findFirst({
      where: { name: 'Student' }
    })

    if (!studentRole) {
      // Create Student role if it doesn't exist
      studentRole = await prisma.role.create({
        data: {
          name: 'Student',
          description: 'Student access to the system',
          isSystem: false
        }
      })
    }

    // Create user account and registration in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate matriculation number
      const matriculationNumber = await generateMatriculationNumber()

      // Create user account
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: `${data.surname} ${data.firstname} ${data.lastname}`,
          password: hashedPassword,
          roleId: studentRole.id,
          isActive: true,
          phoneNumber: data.phone
        }
      })

      // Create registration record
      const registration = await tx.registration.create({
        data: {
          fullName: `${data.surname} ${data.firstname} ${data.lastname}`,
          dateOfBirth: dateOfBirth,
          age: age,
          gender: data.gender,
          address: data.address || '',
          branch: data.branch || 'Online Registration',
          phoneNumber: data.phone,
          emailAddress: data.email,
          matriculationNumber: matriculationNumber,
          emergencyContactName: data.emergencyContactName || `${data.surname} ${data.firstname} ${data.lastname}`,
          emergencyContactRelationship: data.emergencyContactRelationship || 'Self',
          emergencyContactPhone: data.emergencyContactPhone || data.phone,
          parentGuardianName: data.parentGuardianName || '',
          parentGuardianPhone: data.parentGuardianPhone || '',
          parentGuardianEmail: data.parentGuardianEmail || '',
          parentalPermissionGranted: true,
          parentalPermissionDate: new Date()
        }
      })

      return { user, registration }
    })

    // Create notification for admin
    await prisma.notification.create({
      data: {
        type: 'new_student_signup',
        title: 'New Student Account Created',
        message: `${result.user.name} has created a student account and can now log in`,
        priority: 'medium',
        metadata: JSON.stringify({
          userId: result.user.id,
          registrationId: result.registration.id,
          studentName: result.user.name,
          studentEmail: result.user.email,
          studentPhone: result.user.phoneNumber,
          signupDate: new Date()
        })
      }
    }).catch(console.error) // Don't block response if notification fails

    // Send welcome email to the newly registered student (async, don't block response)
    sendWelcomeEmail(result.registration).then((emailResult) => {
      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully to:', result.registration.emailAddress)
      } else {
        console.error('❌ Failed to send welcome email:', emailResult.error)
      }
    }).catch((error) => {
      console.error('❌ Welcome email error:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name
      }
    })

  } catch (error: any) {
    console.error('Signup error:', error)

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this information already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}