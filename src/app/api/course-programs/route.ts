/**
 * Public Course Program Availability API
 * GET /api/course-programs
 * Public endpoint to retrieve course program availability for signup page
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withCache } from '@/lib/cache'

// Course program interface
interface CourseProgram {
  id: string
  name: string
  enabled: boolean
}

// Default course programs
const DEFAULT_PROGRAMS: CourseProgram[] = [
  { id: 'general', name: 'General Certificate', enabled: true },
  { id: 'diploma', name: 'Diploma Certificate', enabled: true },
  { id: 'bachelor', name: "Bachelor's Degree", enabled: true },
  { id: 'master', name: "Master's Degree", enabled: true }
]

// GET - Retrieve course program availability settings (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get course program settings from database
    const key = 'settings:coursePrograms:availability'
    const raw = await withCache(key, 300, async () => {
      const s = await prisma.setting.findUnique({
        where: {
          category_key: {
            category: 'coursePrograms',
            key: 'availability'
          }
        }
      })
      if (s && s.value) return s.value
      return JSON.stringify(DEFAULT_PROGRAMS)
    })
    let programs: CourseProgram[]
    try {
      programs = JSON.parse(raw)
    } catch {
      programs = DEFAULT_PROGRAMS
    }

    // Add cache headers for better performance
    const response = NextResponse.json({
      success: true,
      programs
    })

    response.headers.set('Cache-Control', 'public, max-age=900, s-maxage=900')
    
    return response

  } catch (error) {
    console.error('Course program settings GET error:', error)
    return NextResponse.json({
      error: 'Failed to fetch course program settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}