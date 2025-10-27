import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { getSessionTimeout } from '@/lib/settings'
import { withDynamicRateLimit } from '@/lib/rate-limiter'

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (remoteAddr) {
    return remoteAddr
  }
  // Default to localhost for development
  return '127.0.0.1'
}

// Helper function to track login attempts
async function trackLoginAttempt(email: string, ip: string, success: boolean) {
  try {
    console.log(`Tracking login attempt for ${email} from ${ip}, success: ${success}`)
    
    // Create or update login attempt record
    const result = await prisma.loginAttempt.upsert({
      where: {
        email_ip: {
          email,
          ipAddress: ip
        }
      },
      update: {
        attempts: success ? 0 : { increment: 1 },
        lastAttempt: new Date(),
        lockedUntil: success ? null : undefined
      },
      create: {
        email,
        ipAddress: ip,
        attempts: success ? 0 : 1,
        lastAttempt: new Date()
      }
    })
    
    console.log('Login attempt tracked:', result)
  } catch (error) {
    console.error('Error tracking login attempt:', error)
  }
}

// Helper function to check if account is locked
async function isAccountLocked(email: string, ip: string): Promise<{ locked: boolean; remainingTime?: number }> {
  try {
    // Get security settings from systemConfig table (consistent with admin settings)
    const maxAttemptsResult = await prisma.systemConfig.findUnique({
      where: { key: 'maxLoginAttempts' }
    })
    
    const lockoutDurationResult = await prisma.systemConfig.findUnique({
      where: { key: 'lockoutDuration' }
    })

    const maxAttempts = maxAttemptsResult ? parseInt(maxAttemptsResult.value) : 5
    const lockoutDuration = lockoutDurationResult ? parseInt(lockoutDurationResult.value) : 15

    const loginAttempt = await prisma.loginAttempt.findUnique({
      where: {
        email_ip: {
          email,
          ipAddress: ip
        }
      }
    })

    if (!loginAttempt) {
      return { locked: false }
    }

    // If lockout period has expired, reset attempts by deleting the record
    if (loginAttempt.lockedUntil && loginAttempt.lockedUntil <= new Date()) {
      await prisma.loginAttempt.delete({
        where: {
          email_ip: {
            email,
            ipAddress: ip
          }
        }
      })
      return { locked: false }
    }

    // Check if currently locked
    if (loginAttempt.lockedUntil && loginAttempt.lockedUntil > new Date()) {
      const remainingTimeSeconds = Math.ceil((loginAttempt.lockedUntil.getTime() - Date.now()) / 1000)
      return { locked: true, remainingTime: remainingTimeSeconds }
    }

    // Check if should be locked due to too many attempts
    if (loginAttempt.attempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + lockoutDuration * 60 * 1000)
      // Update the lockout time
      await prisma.loginAttempt.update({
        where: {
          email_ip: {
            email,
            ipAddress: ip
          }
        },
        data: {
          lockedUntil: lockUntil
        }
      })

      return { locked: true, remainingTime: lockoutDuration * 60 }
    }

    return { locked: false }
  } catch (error) {
    console.error('Error checking account lock status:', error)
    return { locked: false }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for login attempts
    const rateLimitResponse = await withDynamicRateLimit(request, 'loginAttempts')
    if (rateLimitResponse) return rateLimitResponse

    console.log('Admin Login API called')
    const { email, password } = await request.json()
    const normalizedEmail = String(email || '').toLowerCase().trim()
    console.log('Admin login attempt for email:', normalizedEmail)

    const clientIP = getClientIP(request)

    // Get session timeout from settings
    console.log('Getting session timeout...')
    const sessionTimeoutHours = await getSessionTimeout()
    console.log('Session timeout hours:', sessionTimeoutHours)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if account is locked
    const lockStatus = await isAccountLocked(normalizedEmail, clientIP)
    if (lockStatus.locked) {
      return NextResponse.json(
        { 
          error: `Account temporarily locked due to too many failed attempts. Try again in ${lockStatus.remainingTime} seconds.`,
          lockoutTime: lockStatus.remainingTime
        },
        { status: 423 } // 423 Locked
      )
    }

    // Only allow admin roles to login through this endpoint
    const allowedAdminRoles = ['Super Admin', 'Admin', 'Lecturer']

    // Try to find admin by email
    const admin = await prisma.admin.findFirst({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Check if admin exists and password matches
    if (!admin || !verifyPassword(password, admin.password)) {
      await trackLoginAttempt(normalizedEmail, clientIP, false)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!admin.isActive) {
      await trackLoginAttempt(normalizedEmail, clientIP, false)
      return NextResponse.json(
        { error: 'Account is Inactive' },
        { status: 401 }
      )
    }

    // Check if the admin has an allowed role
    if (!admin.role || !allowedAdminRoles.includes(admin.role.name)) {
      await trackLoginAttempt(normalizedEmail, clientIP, false)
      return NextResponse.json(
        { 
          error: 'Access denied. Only Super Admin, Admin, and Lecturer roles can access the admin panel.',
        },
        { status: 403 }
      )
    }

    // Successful login - reset login attempts
    await trackLoginAttempt(normalizedEmail, clientIP, true)

    // Generate JWT token for admin with custom session timeout
    const token = signToken({
      adminId: admin.id,
      email: admin.email,
      type: 'admin'
    }, sessionTimeoutHours)

    // Update last login timestamp asynchronously (don't wait)
    prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    }).catch(console.error) // Log error but don't block response

    // Create response with token
    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        type: 'admin',
        role: admin.role
      }
    })

    // Set HTTP-only cookie with custom session timeout
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionTimeoutHours * 60 * 60 // Convert hours to seconds
    })

    console.log('Admin login successful - Cookie set for admin:', admin.email)
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}