import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'
import { filterManageableUsers } from '@/lib/role-hierarchy'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check permissions - only admin roles can view users
    const allowedRoles = ['Super Admin', 'Admin', 'Lecturer']
    if (!allowedRoles.includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const roleId = searchParams.get('roleId') || ''

    // Build base search conditions (without roleId)
    const baseSearchConditions: any = {}
    if (search) {
      baseSearchConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build separate conditions for admin and user tables
    const adminSearchConditions = { ...baseSearchConditions }
    const userSearchConditions = { ...baseSearchConditions }

    // Add role filter if specified - handle differently for admin (optional) vs user (required)
    if (roleId) {
      // roleId is a string in both tables, not an integer
      adminSearchConditions.roleId = roleId // Admin roleId is optional (String?)
      userSearchConditions.roleId = roleId // User roleId is required (String)
    }

    // Get counts first to avoid async issues in Promise.all
    const [totalAdminUsers, totalRegularUsers] = await Promise.all([
      prisma.admin.count({ where: { isActive: true, ...adminSearchConditions } }),
      prisma.user.count({ where: { isActive: true, ...userSearchConditions } })
    ])

    // Get all active users from both admin and user tables
    const [adminUsers, regularUsers] = await Promise.all([
      prisma.admin.findMany({
        where: { 
          isActive: true,
          ...adminSearchConditions
        },
        include: {
          role: true
        },
        orderBy: [
          { role: { name: 'asc' } },
          { name: 'asc' }
        ]
      }),
      prisma.user.findMany({
        where: { 
          isActive: true,
          ...userSearchConditions
        },
        include: {
          role: true
        },
        orderBy: [
          { role: { name: 'asc' } },
          { name: 'asc' }
        ]
      })
    ])

    // Combine and format users
    const allUsers = [
      ...adminUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        type: 'admin' as const,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      })),
      ...regularUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        type: 'user' as const,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }))
    ]

    // Apply role hierarchy filtering - users can only see users they can manage
    const filteredUsers = filterManageableUsers(allUsers, currentUser.role?.name || '')

    // Sort by role hierarchy and then by name
    const roleOrder = {
      'Super Admin': 1,
      'Admin': 2,
      'Lecturer': 3,
      'Student': 4
    }

    filteredUsers.sort((a, b) => {
      const aOrder = roleOrder[a.role?.name as keyof typeof roleOrder] || 999
      const bOrder = roleOrder[b.role?.name as keyof typeof roleOrder] || 999
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      return a.name.localeCompare(b.name)
    })

    // Apply pagination after filtering and sorting
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    const totalFilteredUsers = filteredUsers.length
    const totalPages = Math.ceil(totalFilteredUsers / limit)
    const currentPage = Math.floor(offset / limit) + 1

    return NextResponse.json({
      users: paginatedUsers,
      total: totalFilteredUsers,
      pagination: {
        total: totalFilteredUsers,
        page: currentPage,
        pages: totalPages,
        limit: limit,
        offset: offset
      },
      stats: {
        adminUsers: totalAdminUsers,
        regularUsers: totalRegularUsers,
        filteredUsers: totalFilteredUsers
      },
      message: 'Users retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}