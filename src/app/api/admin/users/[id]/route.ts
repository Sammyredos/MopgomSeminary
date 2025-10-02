import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check if user has permission to manage users
    if (!hasPermission(currentUser, 'users:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { name, surname, firstname, lastname, email, roleId, isActive, password } = body

    // Validate required fields
    if (!name || !email || !roleId) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Check if user exists in either admin or user table
    const [existingAdmin, existingUser] = await Promise.all([
      prisma.admin.findUnique({
        where: { id: userId },
        include: { role: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      })
    ])

    const existingUserRecord = existingAdmin || existingUser
    const userType = existingAdmin ? 'admin' : 'user'

    if (!existingUserRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it conflicts with another user
    if (email.toLowerCase() !== existingUserRecord.email.toLowerCase()) {
      const [emailConflictAdmin, emailConflictUser] = await Promise.all([
        prisma.admin.findFirst({
          where: {
            email: email.toLowerCase(),
            id: { not: userId }
          }
        }),
        prisma.user.findFirst({
          where: {
            email: email.toLowerCase(),
            id: { not: userId }
          }
        })
      ])

      if (emailConflictAdmin || emailConflictUser) {
        return NextResponse.json(
          { error: 'Email address already exists' },
          { status: 400 }
        )
      }
    }

    // Validate role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      roleId,
      isActive: isActive !== undefined ? isActive : existingUserRecord.isActive
    }

    // Hash password if provided
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 12)
    }

    // Update user in the appropriate table
    let updatedUser
    if (userType === 'admin') {
      updatedUser = await prisma.admin.update({
        where: { id: userId },
        data: updateData,
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })
    } else {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })
    }

    // Update user names in notifications if name changed
    if (name !== existingUserRecord.name) {
      try {
        await fetch('/api/admin/notifications/update-user-names', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            oldName: existingUserRecord.name,
            newName: name,
            userEmail: email.toLowerCase()
          })
        })
      } catch (notificationError) {
        console.warn('Failed to update user names in notifications:', notificationError)
        // Don't fail the user update for this
      }
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        type: userType,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check if user has permission to manage users
    if (!hasPermission(currentUser, 'users:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params

    // Prevent users from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists in either admin or user table
    const [existingAdmin, existingUser] = await Promise.all([
      prisma.admin.findUnique({
        where: { id: userId }
      }),
      prisma.user.findUnique({
        where: { id: userId }
      })
    ])

    const existingUserRecord = existingAdmin || existingUser
    const userType = existingAdmin ? 'admin' : 'user'

    if (!existingUserRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user from the appropriate table
    if (userType === 'admin') {
      await prisma.admin.delete({
        where: { id: userId }
      })
    } else {
      await prisma.user.delete({
        where: { id: userId }
      })
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}