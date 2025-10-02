import { NextRequest, NextResponse } from 'next/server'
import { checkDataIntegrity, resolveDataConflict, runDataCleanup } from '@/lib/data-integrity'

export async function GET() {
  try {
    const conflicts = await checkDataIntegrity()
    return NextResponse.json({ conflicts })
  } catch (error) {
    console.error('Data integrity check failed:', error)
    return NextResponse.json(
      { error: 'Failed to perform data integrity check' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, conflictType, details } = await request.json()

    if (action === 'resolve') {
      const success = await resolveDataConflict(conflictType, details)
      return NextResponse.json({ success })
    }

    if (action === 'cleanup') {
      const result = await runDataCleanup()
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Data integrity action failed:', error)
    return NextResponse.json(
      { error: 'Failed to perform data integrity action' },
      { status: 500 }
    )
  }
}