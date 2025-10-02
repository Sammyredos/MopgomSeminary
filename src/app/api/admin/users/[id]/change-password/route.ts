import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
    const { newPassword, confirmPassword } = body

    // Validate required fields
    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation are required' },
        { status: 400 }
      )
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password in the appropriate table
    if (userType === 'admin') {
      await prisma.admin.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}