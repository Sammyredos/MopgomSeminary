import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSafeLogoUrl } from '@/lib/logo-cleanup'
import { withCache } from '@/lib/cache'

// Public API - no authentication required for system branding
export async function GET() {
  try {
    // Get system name and logo from settings
    const rawName = await withCache('settings:branding:systemName', 60, async () => {
      const s = await prisma.setting.findUnique({
        where: {
          category_key: {
            category: 'branding',
            key: 'systemName'
          }
        }
      })
      if (!s) return '"Mopgom TS"'
      return s.value
    })
    let systemName = 'Mopgom TS'
    try {
      systemName = JSON.parse(rawName)
    } catch {
      systemName = rawName
    }

    const logoUrl = await withCache('branding:logoUrl:safe', 30, async () => {
      const u = await getSafeLogoUrl()
      return u || ''
    })
    const finalLogo = logoUrl || null

    // Add cache-busting parameter to logo URL only if it exists
    const logoUrlWithCacheBust = logoUrl ? `${logoUrl}?v=${Date.now()}` : null

    return NextResponse.json({
      success: true,
      systemName,
      logoUrl: logoUrlWithCacheBust,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30', // Reduced cache time for faster updates
      }
    })

  } catch (error) {
    console.error('Error fetching system branding:', error)
    
    // Return default values on error
    return NextResponse.json({
      success: true,
      systemName: 'Mopgom TS',
      logoUrl: null
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      }
    })
  }
}
