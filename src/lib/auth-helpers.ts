import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  type: 'admin' | 'user'
  isActive: boolean
  courseDesired?: string | null
  role: {
    id: string
    name: string
    permissions: Array<{
      id: string
      name: string
    }>
  } | null
}

export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean
  user?: AuthenticatedUser
  error?: string
  status?: number
}> {
  try {
    // Get token from cookie or Authorization header
    let token = request.cookies.get('auth-token')?.value
    
    // If no token in cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return { success: false, error: 'Unauthorized', status: 401 }
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return { success: false, error: 'Invalid token', status: 401 }
    }

    // Determine principal identifier and user type from token
    let userType: 'admin' | 'user' = (payload.type === 'user' || payload.type === 'admin') ? payload.type : 'admin'
    const principalId = payload.adminId

    let user: any = null
    if (userType === 'admin') {
      // Try admin first
      user = await prisma.admin.findUnique({
        where: { id: principalId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      // Fallback to regular user if not found (for legacy tokens mislabelled as admin)
      if (!user) {
        const candidate = await prisma.user.findUnique({
          where: { id: principalId },
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        })
        if (candidate) {
          user = candidate
          userType = 'user'
        }
      }
    } else {
      // Try regular user first
      user = await prisma.user.findUnique({
        where: { id: principalId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      // Fallback to admin if not found (handles rare mislabelled tokens)
      if (!user) {
        const candidate = await prisma.admin.findUnique({
          where: { id: principalId },
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        })
        if (candidate) {
          user = candidate
          userType = 'admin'
        }
      }
    }

    if (!user || !user.isActive) {
      return { success: false, error: 'User not found or inactive', status: 401 }
    }

    // Format user data with proper role permissions structure
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      type: userType,
      isActive: user.isActive,
      courseDesired: null,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions.map((rp: any) => ({
          id: rp.permission?.id || rp.id,
          name: rp.permission?.name || rp.name
        }))
      } : null
    }

    // Attach courseDesired from registration when possible (students)
    try {
      if (authenticatedUser.type === 'user' && authenticatedUser.email) {
        const reg = await prisma.registration.findFirst({
          where: {
            OR: [
              { emailAddress: authenticatedUser.email },
              { emailAddress: authenticatedUser.email.toLowerCase() },
              { emailAddress: authenticatedUser.email.toUpperCase() }
            ]
          },
          select: { courseDesired: true }
        })
        authenticatedUser.courseDesired = reg?.courseDesired || null
      }
    } catch (e) {
      console.warn('authenticateRequest: unable to attach courseDesired', e)
    }

    return { success: true, user: authenticatedUser }

  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed', status: 500 }
  }
}

export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  if (!user.role?.permissions) return false
  
  // Super Admin, Principal, and Admin roles have all permissions
  if (user.role.name === 'Super Admin' || user.role.name === 'Principal' || user.role.name === 'Admin') {
    return true
  }
  
  return user.role.permissions.some(p => 
    p.name === permission || p.name === 'system:admin'
  )
}

export function hasRole(user: AuthenticatedUser, roleName: string): boolean {
  return user.role?.name === roleName
}

export function hasAnyRole(user: AuthenticatedUser, roleNames: string[]): boolean {
  return roleNames.includes(user.role?.name || '')
}
