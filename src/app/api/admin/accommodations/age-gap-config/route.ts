import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/auth-helpers'

const prisma = new PrismaClient()
const CATEGORY = 'accommodations'
const KEY = 'ageGapYears'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    const currentUser = authResult.user!
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const setting = await prisma.setting.findUnique({
      where: { category_key: { category: CATEGORY, key: KEY } }
    })

    const ageGap = setting ? Number(setting.value) : 3
    return NextResponse.json({ success: true, ageGap })
  } catch (error) {
    console.error('Error fetching age gap config:', error)
    return NextResponse.json({ error: 'Failed to fetch age gap config' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    const currentUser = authResult.user!
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager'].includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()
    const ageGap = Number(data.ageGap)
    if (!Number.isInteger(ageGap) || ageGap < 1 || ageGap > 20) {
      return NextResponse.json({ error: 'ageGap must be an integer between 1 and 20' }, { status: 400 })
    }

    const setting = await prisma.setting.upsert({
      where: { category_key: { category: CATEGORY, key: KEY } },
      update: {
        value: String(ageGap),
        updatedAt: new Date()
      },
      create: {
        category: CATEGORY,
        key: KEY,
        value: String(ageGap),
        type: 'number',
        name: 'Accommodation Age Gap (years)',
        description: 'Maximum allowed age difference within a room',
        isSystem: true
      }
    })

    return NextResponse.json({ success: true, ageGap: Number(setting.value), message: 'Age gap updated successfully' })
  } catch (error) {
    console.error('Error updating age gap config:', error)
    return NextResponse.json({ error: 'Failed to update age gap config' }, { status: 500 })
  }
}