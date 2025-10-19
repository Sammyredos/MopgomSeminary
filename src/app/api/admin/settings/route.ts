/**
 * Main Settings API
 * GET /api/admin/settings
 * Retrieves all system settings organized by category
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { getDefaultSettingsByCategory, mergeWithDefaults } from '@/lib/default-settings'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie with validation
    const token = request.cookies?.get('auth-token')?.value
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({ error: 'Unauthorized - No valid token provided' }, { status: 401 })
    }

    // Verify token with error handling
    let payload
    try {
      payload = verifyToken(token)
      if (!payload || typeof payload !== 'object') {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    // Validate payload structure
    if (!payload.adminId || typeof payload.adminId !== 'string') {
      return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 })
    }

    // Determine user type from token
    const userType = payload.type || 'admin'

    let currentUser
    try {
      if (userType === 'admin') {
        currentUser = await prisma.admin.findUnique({
          where: { id: payload.adminId },
          select: { 
            id: true, 
            role: {
              select: {
                name: true,
                id: true
              }
            }, 
            email: true 
          }
        })
      } else {
        // Non-admin users don't have access to admin settings
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Check if user has permission to view settings
    if (userType === 'admin' && !['Super Admin', 'Admin'].includes(currentUser.role?.name)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all settings from database
    const allSettings = await getSettings()

    // Define the categories we want to return
    const categories = ['system', 'branding', 'userManagement', 'notifications', 'security']
    
    // Transform settings to match the expected format
    const transformedSettings: Record<string, any[]> = {}

    for (const category of categories) {
      const categorySettings = allSettings[category] || {}
      const defaultSettings = getDefaultSettingsByCategory(category)
      
      // Merge with defaults to ensure all expected settings are present
      const mergedSettings = mergeWithDefaults(
        Object.entries(categorySettings).map(([key, value]) => ({
          key,
          value,
          name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text'
        })),
        category
      )

      transformedSettings[category] = mergedSettings.map(setting => ({
        key: setting.key,
        name: setting.name,
        value: setting.value,
        type: setting.type,
        options: setting.options,
        description: setting.description
      }))
    }

    return NextResponse.json({
      success: true,
      settings: transformedSettings
    })

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie with validation
    const token = request.cookies?.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload?.adminId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current admin
    const currentUser = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { 
        id: true, 
        role: {
          select: {
            name: true,
            id: true
          }
        }
      }
    })

    if (!currentUser || !['Super Admin', 'Admin'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { category, settings } = body

    if (!category || !settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    // Update settings in database
    for (const setting of settings) {
      if (!setting.key || setting.value === undefined) {
        continue
      }

      await prisma.setting.upsert({
        where: {
          category_key: {
            category,
            key: setting.key
          }
        },
        update: {
          value: JSON.stringify(setting.value),
          updatedAt: new Date()
        },
        create: {
          category,
          key: setting.key,
          value: JSON.stringify(setting.value),
          type: setting.type || 'text',
          name: setting.name || setting.key,
          description: setting.description || '',
          isSystem: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}