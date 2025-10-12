import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { getSessionTimeout, getLoginAttemptsLimit, getLockoutDuration } from '@/lib/settings'
import { withDynamicRateLimit } from '@/lib/rate-limiter'

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || 'unknown'
}

// Helper function to track login attempts
async function trackLoginAttempt(email: string, ipAddress: string, success: boolean) {
  try {
    if (success) {
      // Reset attempts on successful login
      await prisma.loginAttempt.deleteMany({
        where: {
          OR: [
            { email: email },
            { ipAddress: ipAddress }
          ]
        }
      })
    } else {
      // Increment failed attempts
      const maxAttempts = await getLoginAttemptsLimit()
      const lockoutDuration = await getLockoutDuration()
      
      const result = await prisma.loginAttempt.upsert({
        where: {
          email_ip: {
            email: email,
            ipAddress: ipAddress
          }
        },
        update: {
          attempts: {
            increment: 1
          },
          lastAttempt: new Date()
        },
        create: {
          email: email,
          ipAddress: ipAddress,
          attempts: 1,
          lastAttempt: new Date()
        }
      })
      
      // If this attempt reaches the max limit, set the lockout time
      if (result.attempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + lockoutDuration * 60 * 1000)
        await prisma.loginAttempt.update({
          where: {
            email_ip: {
              email: email,
              ipAddress: ipAddress
            }
          },
          data: {
            lockedUntil: lockUntil
          }
        })
      }
    }
  } catch (error) {
    console.error('Error tracking login attempt:', error)
  }
}

// Helper function to check if account is locked
async function isAccountLocked(email: string, ipAddress: string) {
  try {
    const maxAttempts = await getLoginAttemptsLimit()
    const lockoutDuration = await getLockoutDuration()
    
    const loginAttempt = await prisma.loginAttempt.findUnique({
      where: {
        email_ip: {
          email: email,
          ipAddress: ipAddress
        }
      }
    })
    
    if (!loginAttempt) {
      return { locked: false, remainingTime: 0 }
    }
    
    // Check if currently locked using lockedUntil field
    if (loginAttempt.lockedUntil && loginAttempt.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((loginAttempt.lockedUntil.getTime() - Date.now()) / 1000)
      return { locked: true, remainingTime: remainingSeconds }
    }
    
    // Check if should be locked due to too many attempts (fallback for old records)
    if (loginAttempt.attempts >= maxAttempts && !loginAttempt.lockedUntil) {
      const lockoutEnd = new Date(loginAttempt.lastAttempt.getTime() + (lockoutDuration * 60 * 1000))
      const now = new Date()
      
      if (now < lockoutEnd) {
        // Update the record with proper lockout time
        await prisma.loginAttempt.update({
          where: {
            email_ip: {
              email: email,
              ipAddress: ipAddress
            }
          },
          data: {
            lockedUntil: lockoutEnd
          }
        })
        
        const remainingSeconds = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 1000)
        return { locked: true, remainingTime: remainingSeconds }
      }
    }
    
    // If lockout period has expired, reset attempts
    if (loginAttempt.lockedUntil && loginAttempt.lockedUntil <= new Date()) {
      await prisma.loginAttempt.delete({
        where: {
          email_ip: {
            email: email,
            ipAddress: ipAddress
          }
        }
      })
    }
    
    return { locked: false, remainingTime: 0 }
  } catch (error) {
    console.error('Error checking account lock status:', error)
    return { locked: false, remainingTime: 0 }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for login attempts
    const rateLimitResponse = await withDynamicRateLimit(request, 'loginAttempts')
    if (rateLimitResponse) return rateLimitResponse

    console.log('Login API called')
    const { email, password } = await request.json()
    console.log('Login attempt for email:', email)

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
    const lockStatus = await isAccountLocked(email, clientIP)
    if (lockStatus.locked) {
      await trackLoginAttempt(email, clientIP, false)
      return NextResponse.json(
        { 
          error: `Account temporarily locked due to too many failed attempts. Try again in ${lockStatus.remainingTime} seconds.`,
          lockoutTime: lockStatus.remainingTime
        },
        { status: 423 } // 423 Locked
      )
    }

    // Optimized: Try to find admin by email with minimal data first
    const admin = await prisma.admin.findUnique({
      where: { email },
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

    // If admin found and password matches
    if (admin && verifyPassword(password, admin.password)) {
      if (!admin.isActive) {
        await trackLoginAttempt(email, clientIP, false)
        return NextResponse.json(
          { error: 'Account is Inactive' },
          { status: 401 }
        )
      }

      // Check if admin role should not login via /login endpoint
      const adminRoleNames = ['Super Admin', 'Admin', 'Manager', 'Staff', 'Principal', 'Department Head', 'Instructor', 'Librarian']
      if (admin.role && adminRoleNames.includes(admin.role.name)) {
        await trackLoginAttempt(email, clientIP, false)
        return NextResponse.json(
          { 
            error: 'Admin accounts must use the admin login page',
            redirectTo: '/admin/login'
          },
          { status: 403 }
        )
      }

      // Successful login - reset login attempts
      await trackLoginAttempt(email, clientIP, true)

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

      return response
    }

    // If admin not found or password doesn't match, try user table with optimized query
    const user = await prisma.user.findUnique({
      where: { email },
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

    if (!user || !verifyPassword(password, user.password)) {
      await trackLoginAttempt(email, clientIP, false)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      await trackLoginAttempt(email, clientIP, false)
      return NextResponse.json(
        { error: 'Account is Inactive' },
        { status: 401 }
      )
    }

    // Successful login - reset login attempts
    await trackLoginAttempt(email, clientIP, true)

    // Generate JWT token for user with custom session timeout
    const token = signToken({
      adminId: user.id, // Keep same field name for compatibility
      email: user.email,
      type: 'user'
    }, sessionTimeoutHours)

    // Update last login timestamp asynchronously (don't wait)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(console.error) // Log error but don't block response

    // Create response with token
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: 'user',
        role: user.role
      }
    })

    // Set HTTP-only cookie with custom session timeout
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionTimeoutHours * 60 * 60 // Convert hours to seconds
    })

    console.log('Login successful - Cookie set for user:', user.email)
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
