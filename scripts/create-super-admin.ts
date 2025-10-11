import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin user...')

    // Define all permissions that should exist
    const allPermissions = [
      // User Management
      { name: 'users.read', description: 'View users', resource: 'users', action: 'read' },
      { name: 'users.write', description: 'Create and edit users', resource: 'users', action: 'write' },
      { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'users.manage', description: 'Full user management', resource: 'users', action: 'manage' },

      // Registration Management
      { name: 'registrations.read', description: 'View registrations', resource: 'registrations', action: 'read' },
      { name: 'registrations.write', description: 'Create and edit registrations', resource: 'registrations', action: 'write' },
      { name: 'registrations.delete', description: 'Delete registrations', resource: 'registrations', action: 'delete' },
      { name: 'registrations.manage', description: 'Full registration management', resource: 'registrations', action: 'manage' },

      // Accommodation Management
      { name: 'accommodations.read', description: 'View accommodations', resource: 'accommodations', action: 'read' },
      { name: 'accommodations.write', description: 'Create and edit accommodations', resource: 'accommodations', action: 'write' },
      { name: 'accommodations.delete', description: 'Delete accommodations', resource: 'accommodations', action: 'delete' },
      { name: 'accommodations.manage', description: 'Full accommodation management', resource: 'accommodations', action: 'manage' },

      // Analytics
      { name: 'analytics.read', description: 'View analytics', resource: 'analytics', action: 'read' },
      { name: 'analytics.manage', description: 'Full analytics access', resource: 'analytics', action: 'manage' },

      // Reports
      { name: 'reports.read', description: 'View reports', resource: 'reports', action: 'read' },
      { name: 'reports.write', description: 'Create reports', resource: 'reports', action: 'write' },
      { name: 'reports.manage', description: 'Full report management', resource: 'reports', action: 'manage' },

      // Communications
      { name: 'communications.read', description: 'View communications', resource: 'communications', action: 'read' },
      { name: 'communications.write', description: 'Send communications', resource: 'communications', action: 'write' },
      { name: 'communications.manage', description: 'Full communication management', resource: 'communications', action: 'manage' },

      // Settings
      { name: 'settings.read', description: 'View settings', resource: 'settings', action: 'read' },
      { name: 'settings.write', description: 'Modify settings', resource: 'settings', action: 'write' },
      { name: 'settings.manage', description: 'Full settings management', resource: 'settings', action: 'manage' },

      // System Administration
      { name: 'system.read', description: 'View system information', resource: 'system', action: 'read' },
      { name: 'system.write', description: 'Modify system configuration', resource: 'system', action: 'write' },
      { name: 'system.manage', description: 'Full system administration', resource: 'system', action: 'manage' },

      // Role Management
      { name: 'roles.read', description: 'View roles', resource: 'roles', action: 'read' },
      { name: 'roles.write', description: 'Create and edit roles', resource: 'roles', action: 'write' },
      { name: 'roles.delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'roles.manage', description: 'Full role management', resource: 'roles', action: 'manage' },

      // Notifications
      { name: 'notifications.read', description: 'View notifications', resource: 'notifications', action: 'read' },
      { name: 'notifications.write', description: 'Send notifications', resource: 'notifications', action: 'write' },
      { name: 'notifications.manage', description: 'Full notification management', resource: 'notifications', action: 'manage' },
    ]

    console.log('📝 Creating permissions...')
    
    // Create permissions (upsert to avoid duplicates)
    const createdPermissions: any[] = []
    for (const permission of allPermissions) {
      const created = await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      })
      createdPermissions.push(created)
    }

    console.log(`✅ Created/updated ${createdPermissions.length} permissions`)

    // Create Super Admin role with all permissions
    console.log('👑 Creating Super Admin role...')
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {
        description: 'Full system access with all permissions',
        isSystem: true,
      },
      create: {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        isSystem: true,
      }
    })

    // Connect permissions to Super Admin role
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      })
    }

    console.log(`✅ Super Admin role created with ${createdPermissions.length} permissions`)

    // Create other essential roles
    console.log('🔧 Creating other system roles...')

    // Admin role (most permissions except system management)
    const adminPermissions = createdPermissions.filter(p =>
      !p.name.startsWith('system.') || p.name === 'system.read'
    )

    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {
        description: 'Administrative access with most permissions',
        isSystem: true,
      },
      create: {
        name: 'Admin',
        description: 'Administrative access with most permissions',
        isSystem: true,
      }
    })

    console.log(`✅ Admin role created with ${adminPermissions.length} permissions`)

    // Manager role (read/write but limited delete/manage)
    const managerPermissions = createdPermissions.filter(p =>
      p.action === 'read' || p.action === 'write' ||
      (p.action === 'manage' && ['communications', 'notifications'].includes(p.resource))
    )

    const managerRole = await prisma.role.upsert({
      where: { name: 'Manager' },
      update: {
        description: 'Management access with read/write permissions',
        isSystem: true,
      },
      create: {
        name: 'Manager',
        description: 'Management access with read/write permissions',
        isSystem: true,
      }
    })

    // Connect permissions to Manager role
    for (const permission of managerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id
        }
      })
    }

    // Staff role (mostly read with some write)
    const staffPermissions = createdPermissions.filter(p =>
      p.action === 'read' ||
      (p.action === 'write' && ['registrations', 'accommodations', 'communications'].includes(p.resource))
    )

    const staffRole = await prisma.role.upsert({
      where: { name: 'Staff' },
      update: {
        description: 'Staff access with limited write permissions',
        isSystem: true,
      },
      create: {
        name: 'Staff',
        description: 'Staff access with limited write permissions',
        isSystem: true,
      }
    })

    // Connect permissions to Staff role
    for (const permission of staffPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: staffRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: staffRole.id,
          permissionId: permission.id
        }
      })
    }

    // Viewer role (read-only)
    const viewerPermissions = createdPermissions.filter(p => p.action === 'read')

    const viewerRole = await prisma.role.upsert({
      where: { name: 'Viewer' },
      update: {
        description: 'Read-only access to most features',
        isSystem: true,
      },
      create: {
        name: 'Viewer',
        description: 'Read-only access to most features',
        isSystem: true,
      }
    })

    // Connect permissions to Viewer role
    for (const permission of viewerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: viewerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: viewerRole.id,
          permissionId: permission.id
        }
      })
    }

    console.log('✅ All system roles created successfully')

    // Create the Super Admin user
    console.log('👤 Creating Super Admin user...')

    // Use environment variable for password, fallback to default
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123@'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    const oldEmail = 'superadmin@mopgomseminary.com'
    const newEmail = 's.obadina@mopgomts.com'

    // If an admin exists with the old email, update it to the new email.
    const existingOld = await prisma.admin.findUnique({ where: { email: oldEmail } })

    let superAdmin
    if (existingOld) {
      superAdmin = await prisma.admin.update({
        where: { email: oldEmail },
        data: {
          email: newEmail,
          password: hashedPassword,
          name: 'System Administrator',
          roleId: superAdminRole.id,
          isActive: true
        }
      })
    } else {
      superAdmin = await prisma.admin.upsert({
        where: { email: newEmail },
        update: {
          password: hashedPassword,
          name: 'System Administrator',
          roleId: superAdminRole.id,
          isActive: true
        },
        create: {
          email: newEmail,
          password: hashedPassword,
          name: 'System Administrator',
          roleId: superAdminRole.id,
          isActive: true
        }
      })
    }

    console.log('\n🎉 Super Admin created successfully!')
    console.log('📧 Email: s.obadina@mopgomts.com')
    console.log(`🔑 Password: ${adminPassword}`)
    console.log('👑 Role: Super Admin')
    console.log(`🛡️  Permissions: ${createdPermissions.length} permissions`)
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!')
    console.log('🔐 You now have full access to all Mopgom TS platform features.')

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log('\n✅ Setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })
