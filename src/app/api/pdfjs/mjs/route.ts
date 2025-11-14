export const runtime = 'nodejs'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Serves the pdfjs-dist ESM runtime (pdf.mjs) as same-origin JS module.
 * Prefers legacy build; falls back to modern build.
 */
export async function GET(_req: NextRequest) {
  try {
    const legacyPath = path.resolve(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs')
    const modernPath = path.resolve(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.mjs')
    const mjsPath = fs.existsSync(legacyPath) ? legacyPath : modernPath

    if (!fs.existsSync(mjsPath)) {
      return new NextResponse('/* pdf.mjs not found */', {
        status: 404,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      })
    }

    const content = await fs.promises.readFile(mjsPath)
    return new NextResponse(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (err) {
    return new NextResponse(`/* Failed to serve pdf.mjs: ${String(err)} */`, {
      status: 500,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
    })
  }
}