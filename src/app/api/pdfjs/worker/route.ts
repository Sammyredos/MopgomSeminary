export const runtime = 'nodejs'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Serves the pdfjs-dist worker script from node_modules as same-origin JS.
 * This avoids bundler config and ensures Worker can load in production.
 */
export async function GET(_req: NextRequest) {
  try {
    const baseDir = path.resolve(process.cwd(), 'node_modules', 'pdfjs-dist', 'build')
    const mjsPath = path.join(baseDir, 'pdf.worker.min.mjs')
    const jsPath = path.join(baseDir, 'pdf.worker.min.js')
    const workerPath = fs.existsSync(mjsPath) ? mjsPath : jsPath

    if (!fs.existsSync(workerPath)) {
      return new NextResponse('/* pdf.worker.min.js not found */', {
        status: 404,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8'
        }
      })
    }

    const content = await fs.promises.readFile(workerPath)
    // NextResponse expects a BodyInit; convert Buffer to Uint8Array
    return new NextResponse(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        // cache aggressively; worker rarely changes between deploys
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (err) {
    return new NextResponse(`/* Failed to serve pdf worker: ${String(err)} */`, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8'
      }
    })
  }
}