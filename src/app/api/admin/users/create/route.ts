import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'
import { hashPassword } from '@/lib/auth'
import { getAssignableRoles } from '@/lib/role-hierarchy'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check permissions - only admin roles can create users
    const allowedRoles = ['Super Admin', 'Admin', 'Lecturer']
    if (!allowedRoles.includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, email, password, roleName, userType } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !roleName || !userType) {
      return NextResponse.json(
        { error: 'Name, email, password, role, and user type are required' },
        { status: 400 }
      )
    }

    // Validate user type
    if (!['admin', 'user'].includes(userType)) {
      return NextResponse.json(
        { error: 'User type must be either "admin" or "user"' },
        { status: 400 }
      )
    }

    // Check if user can assign this role
    const assignableRoles = getAssignableRoles(currentUser.role?.name || '')
    if (!assignableRoles.includes(roleName)) {
      return NextResponse.json(
        { error: `You cannot assign the role "${roleName}"` },
        { status: 403 }
      )
    }

    // Check if email already exists in either table
    const [existingAdmin, existingUser] = await Promise.all([
      prisma.admin.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { email } })
    ])

    if (existingAdmin || existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Get the role
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = hashPassword(password)

    let newUser
    if (userType === 'admin') {
      // Create admin user
      newUser = await prisma.admin.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: role.id,
          isActive: true
        },
        include: {
          role: true
        }
      })
    } else {
      // Create regular user
      newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: role.id,
          isActive: true
        },
        include: {
          role: true
        }
      })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        type: userType
      },
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}