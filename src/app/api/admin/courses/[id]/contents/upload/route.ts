import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasPermission, hasRole } from '@/lib/auth-helpers'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Upload PDF file for course content
 * POST /api/admin/courses/[id]/contents/upload
 * Accepts multipart/form-data with field `file` (PDF)
 * Saves file under public/uploads/courses/{id}/content and returns a public URL
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    if (auth.user.type !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canManage = hasPermission(auth.user, 'manage_courses')
    const isSuperAdmin = hasRole(auth.user, 'Super Admin')
    if (!canManage && !isSuperAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: courseId } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate type and size
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF is allowed.' }, { status: 400 })
    }

    // 15 MB size limit for course content PDFs
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max size is 15MB.' }, { status: 400 })
    }

    // Ensure directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'courses', courseId, 'content')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Sanitize filename and write file
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `pdf-${timestamp}-${safeName}`
    const filepath = join(uploadsDir, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/courses/${courseId}/content/${filename}`

    return NextResponse.json({ success: true, fileUrl: publicUrl })
  } catch (error: any) {
    console.error('POST /admin/courses/[id]/contents/upload error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}