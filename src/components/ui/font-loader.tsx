'use client'

import { useEffect, useState } from 'react'
import { verifyApercuFonts, areApercuFontsLoaded } from '@/lib/font-verification'
import { getCurrentSystemName, isSystemNameLoaded } from './reactive-system-name'
import { useUser } from '@/contexts/UserContext'

interface FontLoaderProps {
  children: React.ReactNode
  showLoadingScreen?: boolean
  showOnlyOnInitialLogin?: boolean
  timeout?: number
}

export function FontLoader({
  children,
  showLoadingScreen = true,
  showOnlyOnInitialLogin = false,
  timeout = 3000
}: FontLoaderProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [systemName, setSystemName] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [isInitialLogin, setIsInitialLogin] = useState(false)
  const { currentUser, loading: userLoading } = useUser()

  // Handle client-side hydration
  useEffect(() => {
    // Use a small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsClient(true)
      // Set default system name only on client
        setSystemName('Mopgom TS')
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  // Track initial login state
  useEffect(() => {
    if (!isClient || !showOnlyOnInitialLogin) return

    // Check if this is an initial login session
    const checkInitialLogin = () => {
      const hasShownLoader = sessionStorage.getItem('flashloader-shown')
      const isLoggedIn = currentUser !== null
      
      // Show loader if user is logged in and we haven't shown it in this session
      if (isLoggedIn && !hasShownLoader && !userLoading) {
        setIsInitialLogin(true)
        sessionStorage.setItem('flashloader-shown', 'true')
      } else {
        setIsInitialLogin(false)
      }
    }

    checkInitialLogin()
  }, [isClient, currentUser, userLoading, showOnlyOnInitialLogin])

  useEffect(() => {
    // Only run on client side after hydration
    if (!isClient) return

    // Load system name immediately
    const loadSystemName = async () => {
      try {
        // Try to get cached system name first
        const cachedName = localStorage.getItem('system-name')
        if (cachedName) {
          setSystemName(cachedName)
          return
        }

        // Check if system name is already loaded globally
        if (isSystemNameLoaded()) {
          setSystemName(getCurrentSystemName())
          return
        }

        // Try to load from API quickly
        try {
          const response = await fetch('/api/admin/settings', {
            cache: 'no-store',
            signal: AbortSignal.timeout(2000) // 2 second timeout
          })
          if (response.ok) {
            const data = await response.json()
            const brandingSettings = data.settings?.branding || []
            const systemNameSetting = brandingSettings.find((s: any) => s.key === 'systemName')
            const apiSystemName = systemNameSetting?.value || 'Mopgom TS'
            setSystemName(apiSystemName)

            // Cache for next time
            if (typeof window !== 'undefined') {
              localStorage.setItem('system-name', apiSystemName)
            }
            return
          }
        } catch (apiError) {
          console.log('API not available during loading, using fallback')
        }

        // Fallback to default
        setSystemName('Mopgom TS')
      } catch (error) {
        console.error('Error loading system name for loading screen:', error)
        setSystemName('Mopgom TS')
      }
    }

    loadSystemName()

    const loadFonts = async () => {
      try {
        console.log('🔤 Starting Space Grotesk font loading...')
        setLoadingProgress(10)

        // Check if FontFace API is supported
        if ('fonts' in document) {
          setLoadingProgress(20)

          // Define the fonts to load with proper paths
          const fonts = [
            new FontFace('Space Grotesk', 'url(/fonts/SpaceGrotesk-Regular.woff2)', {
              weight: '400',
              style: 'normal',
              display: 'swap'
            }),
            new FontFace('Space Grotesk', 'url(/fonts/SpaceGrotesk-Medium.woff2)', {
              weight: '500',
              style: 'normal',
              display: 'swap'
            }),
            new FontFace('Space Grotesk', 'url(/fonts/SpaceGrotesk-Bold.woff2)', {
              weight: '700',
              style: 'normal',
              display: 'swap'
            })
          ]

          setLoadingProgress(40)

          // Load all fonts with error handling
          const loadPromises = fonts.map(async (font, index) => {
            try {
              console.log(`Loading ${font.family} ${font.weight}...`)
              const loadedFont = await font.load()
              document.fonts.add(loadedFont)
              setLoadingProgress(40 + (index + 1) * 15)
              console.log(`✅ Loaded ${font.family} ${font.weight}`)
              return loadedFont
            } catch (error) {
              console.warn(`❌ Failed to load font: ${font.family} ${font.weight}`, error)
              return null
            }
          })

          // Wait for all fonts to load
          await Promise.all(loadPromises)
          setLoadingProgress(85)

          // Additional check to ensure fonts are ready
          await document.fonts.ready
          setLoadingProgress(95)

          // Verify fonts using our verification system
          const fontStatuses = await verifyApercuFonts()
          const allLoaded = areApercuFontsLoaded()

          console.log('📊 Space Grotesk font loading summary:', fontStatuses)

          if (allLoaded) {
            console.log('✅ All Space Grotesk fonts loaded and verified successfully')
          } else {
            console.warn('⚠️ Some Space Grotesk fonts failed to load, using fallbacks')
          }

          setLoadingProgress(100)
          setFontsLoaded(true)
        } else {
          // Fallback for browsers without FontFace API
          console.warn('FontFace API not supported, using CSS fallback')
          setLoadingProgress(100)

          // Use a timeout as fallback
          setTimeout(() => {
            setFontsLoaded(true)
          }, 500)
        }
      } catch (error) {
        console.error('Error loading fonts:', error)
        setLoadingProgress(100)
        // Still show content even if fonts fail to load
        setFontsLoaded(true)
      }
    }

    // Set a maximum timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Font loading timeout reached, showing content with fallback fonts')
      setFontsLoaded(true)
    }, timeout)

    loadFonts().finally(() => {
      clearTimeout(timeoutId)
    })

    return () => {
      clearTimeout(timeoutId)
    }
  }, [timeout, isClient])

  // Only show loading state on client side to prevent hydration mismatch
  if (!isClient) {
    // Return children immediately during SSR to prevent hydration issues
    return <>{children}</>
  }

  // Determine if we should show the loading screen
  const shouldShowLoader = () => {
    if (!isClient) return false
    if (!showLoadingScreen) return false
    if (fontsLoaded) return false
    
    // If showOnlyOnInitialLogin is enabled, only show on initial login
    if (showOnlyOnInitialLogin) {
      return isInitialLogin
    }
    
    // Default behavior: show loading screen
    return true
  }

  if (!shouldShowLoader()) {
    return <>{children}</>
  }

  // Show loading state while fonts are loading (client-side only)
  return (
    <div
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          color: '#374151',
          flexDirection: 'column'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          {/* Logo or Brand */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#111827',
              lineHeight: '1.2'
            }}>
              {systemName || 'Mopgom TS'}
            </h1>
            <p style={{
              fontSize: '14px',
              margin: 0,
              color: '#6b7280'
            }}>
              Initializing System...
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              backgroundColor: '#4f46e5',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <p style={{
            fontSize: '12px',
            margin: '12px 0 0 0',
            color: '#9ca3af'
          }}>
            {loadingProgress}% complete
          </p>
        </div>
      </div>
    )
}
