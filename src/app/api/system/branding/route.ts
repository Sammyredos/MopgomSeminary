import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSafeLogoUrl } from '@/lib/logo-cleanup'

// Public API - no authentication required for system branding
export async function GET() {
  try {
    // Get system name and logo from settings
    const brandingSettings = await prisma.setting.findMany({
      where: {
        category: 'branding',
        key: {
          in: ['systemName', 'logoUrl']
        }
      }
    })

    // Debug logging removed for production

    const systemNameSetting = brandingSettings.find(s => s.key === 'systemName')

    let systemName = 'Mopgom TS' // Default fallback
    let logoUrl: string | null = null

    if (systemNameSetting) {
      try {
        systemName = JSON.parse(systemNameSetting.value)
        console.log('✅ System name from JSON:', systemName)
      } catch {
        systemName = systemNameSetting.value
        console.log('✅ System name from raw value:', systemName)
      }
    } else {
      // Reduced logging frequency for production
      if (Math.random() < 0.1) { // Only log 10% of the time
        console.log('⚠️ No system name setting found, using default:', systemName)
      }
    }

    // Get safe logo URL that's guaranteed to exist or null
    logoUrl = await getSafeLogoUrl()

    // Add cache-busting parameter to logo URL only if it exists
    const logoUrlWithCacheBust = logoUrl ? `${logoUrl}?v=${Date.now()}` : null

    return NextResponse.json({
      success: true,
      systemName,
      logoUrl: logoUrlWithCacheBust,
      timestamp: Date.now() // Add timestamp for cache invalidation
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
