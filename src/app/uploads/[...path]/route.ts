export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Join the path segments
    const { path: segments } = await params
    const filePath = segments.join('/')
    
    // Construct the full file path
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath)
    
    // Security check: ensure the path is within the uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!fullPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 })
    }
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Read the file
    const fileBuffer = await readFile(fullPath)
    
    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'png':
        contentType = 'image/png'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'ico':
        contentType = 'image/x-icon'
        break
      case 'pdf':
        contentType = 'application/pdf'
        break
    }
    
    // Return the file with appropriate headers
    // Convert Buffer to Uint8Array to satisfy Web Response BodyInit types
    const body = new Uint8Array(fileBuffer)
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': fileBuffer.length.toString(),
    }

    // Encourage inline display for PDFs to avoid forced download
    if (extension === 'pdf') {
      const filename = filePath.split('/').pop() || 'file.pdf'
      headers['Content-Disposition'] = `inline; filename="${filename}"`
    }

    return new NextResponse(body, {
      status: 200,
      headers,
    })
    
  } catch (error) {
    console.error('Error serving uploaded file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}
