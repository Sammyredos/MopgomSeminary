import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest, hasAnyRole } from '@/lib/auth-helpers'

// GET /api/admin/roles - Fetch all roles
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check if user has permission to view roles
    if (!hasAnyRole(currentUser, ['Super Admin', 'Admin', 'Lecturer'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: {
            admins: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filter to only show the 4 simplified roles
    const simplifiedRoles = roles.filter(role => 
      ['Super Admin', 'Admin', 'Lecturer', 'Student'].includes(role.name)
    )

    return NextResponse.json({
      success: true,
      roles: simplifiedRoles
    })

  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/admin/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Only Super Admin and Admin can create roles
    if (!hasAnyRole(currentUser, ['Super Admin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, description, permissionIds } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Validate that the role name is one of the allowed simplified roles
    const allowedRoles = ['Super Admin', 'Admin', 'Lecturer', 'Student']
    if (!allowedRoles.includes(name)) {
      return NextResponse.json({ 
        error: `Role name must be one of: ${allowedRoles.join(', ')}` 
      }, { status: 400 })
    }

    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 409 })
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name,
        description: description || `${name} role`,
        isSystem: ['Super Admin', 'Admin'].includes(name),
        permissions: permissionIds && permissionIds.length > 0 ? {
          connect: permissionIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        permissions: true,
        _count: {
          select: {
            admins: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      role,
      message: 'Role created successfully'
    })

  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}