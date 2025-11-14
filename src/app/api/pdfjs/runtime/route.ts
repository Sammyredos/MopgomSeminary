export const runtime = 'nodejs'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Small module that imports pdfjs-dist ESM from a same-origin route
 * and attaches it to window as `pdfjsLib` for client usage.
 */
export async function GET(_req: NextRequest) {
  const script = `import * as pdfjsLib from '/api/pdfjs/mjs';
window.pdfjsLib = pdfjsLib;`
  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  })
}