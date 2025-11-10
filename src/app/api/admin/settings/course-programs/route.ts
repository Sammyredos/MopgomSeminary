/**
 * Course Program Availability Settings API
 * GET/PUT /api/admin/settings/course-programs
 * Manages course program availability configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'

// Course program interface
interface CourseProgram {
  id: string
  name: string
  enabled: boolean
}

// Validation schema for course program settings
const courseProgramSchema = z.object({
  programs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean()
  }))
})

// Default course programs
const DEFAULT_PROGRAMS: CourseProgram[] = [
  { id: 'general', name: 'General Certificate', enabled: true },
  { id: 'diploma', name: 'Diploma Certificate', enabled: true },
  { id: 'bachelor', name: "Bachelor's Degree", enabled: true },
  { id: 'master', name: "Master's Degree", enabled: true }
]

// GET - Retrieve course program availability settings
export async function GET(request: NextRequest) {
  try {
    // Authenticate user using the proper auth helper
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication failed' 
      }, { status: authResult.status || 401 })
    }

    // Get course program settings from database
    const setting = await prisma.setting.findUnique({
      where: {
        category_key: {
          category: 'coursePrograms',
          key: 'availability'
        }
      }
    })

    let programs: CourseProgram[]
    
    if (setting) {
      try {
        programs = JSON.parse(setting.value)
      } catch (error) {
        console.error('Failed to parse course program settings:', error)
        programs = DEFAULT_PROGRAMS
      }
    } else {
      programs = DEFAULT_PROGRAMS
    }

    return NextResponse.json({
      success: true,
      programs
    })

  } catch (error) {
    console.error('Course program settings GET error:', error)
    return NextResponse.json({
      error: 'Failed to fetch course program settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update course program availability settings
export async function PUT(request: NextRequest) {
  try {
    // Debug: Log all headers
    console.log('PUT Request Headers:', Object.fromEntries(request.headers.entries()))
    
    // Authenticate user using the proper auth helper
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication failed' 
      }, { status: authResult.status || 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = courseProgramSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { programs } = validationResult.data

    // Check if setting exists
    const existingSetting = await prisma.setting.findUnique({
      where: {
        category_key: {
          category: 'coursePrograms',
          key: 'availability'
        }
      }
    })

    const settingData = {
      category: 'coursePrograms',
      key: 'availability',
      name: 'Course Program Availability',
      value: JSON.stringify(programs),
      type: 'json',
      description: 'Controls which course programs are available for student registration',
      updatedAt: new Date()
    }

    if (existingSetting) {
      // Update existing setting
      await prisma.setting.update({
        where: { id: existingSetting.id },
        data: settingData
      })
    } else {
      // Create new setting
      await prisma.setting.create({
        data: {
          ...settingData,
          isSystem: false,
          createdAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Course program settings updated successfully',
      programs
    })

  } catch (error) {
    console.error('Course program settings PUT error:', error)
    return NextResponse.json({
      error: 'Failed to update course program settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}