'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { SessionTimeout } from '@/components/SessionTimeout'
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch'
import { pagePreloader } from '@/lib/page-preloader'
import { useUser } from '@/contexts/UserContext'
import { useBranding } from '@/contexts/BrandingContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Menu } from 'lucide-react'

interface StudentLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

export function StudentLayout({ 
  children, 
  title, 
  description 
}: StudentLayoutProps) {
  const { setupHoverPrefetch, observeElement } = useRoutePrefetch()
  const { currentUser, loading: isLoadingUser } = useUser()
  const { branding } = useBranding()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [sessionTimeout, setSessionTimeout] = useState(24) // Default fallback in hours
  const systemInitials = branding.systemName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)

  // Fetch session timeout from settings
  useEffect(() => {
    const fetchSessionTimeout = async () => {
      try {
        const response = await fetch('/api/admin/settings/security')
        if (response.ok) {
          const data = await response.json()
          // Convert minutes to hours for SessionTimeout component
          const timeoutHours = (data.settings?.sessionTimeout || 60) / 60
          setSessionTimeout(timeoutHours)
        }
      } catch (error) {
        console.error('Failed to fetch session timeout:', error)
        // Keep default value
      }
    }

    fetchSessionTimeout()
  }, [])

  // Don't render layout if user is not authenticated or not a student
  if (!isLoadingUser && (!currentUser || currentUser.role?.name !== 'Student')) {
    return null
  }

  useEffect(() => {
    // Setup intelligent prefetching for navigation links
    if (sidebarRef.current) {
      const navLinks = sidebarRef.current.querySelectorAll('a[href^="/student/"]')
      
      navLinks.forEach((link) => {
        const href = link.getAttribute('href')
        if (href) {
          // Setup hover prefetching with 100ms delay
          const cleanup = setupHoverPrefetch(link as HTMLElement, href, 100)
          
          // Also observe for intersection-based prefetching
          observeElement(link as HTMLElement)
          
          // Store cleanup function for later
          ;(link as any)._prefetchCleanup = cleanup
        }
      })
    }

    // Cleanup on unmount
    return () => {
      if (sidebarRef.current) {
        const navLinks = sidebarRef.current.querySelectorAll('a[href^="/student/"]')
        navLinks.forEach((link) => {
          const cleanup = (link as any)._prefetchCleanup
          if (cleanup) cleanup()
        })
      }
    }
  }, [setupHoverPrefetch, observeElement])

  useEffect(() => {
    // Preload critical student routes and APIs
    const preloadCritical = () => {
      // Preload common student routes
      const studentRoutes = [
        '/student/dashboard',
        '/student/courses',
        '/student/grades',
        '/student/schedule',
        '/student/calendar',
        '/student/assignments',
        '/student/messages',
        '/student/profile'
      ]

      studentRoutes.forEach(route => {
        pagePreloader.preloadRoute(route).catch(console.warn)
      })
      
      // Also preload critical APIs
      pagePreloader.preloadCriticalAPIs().catch(console.warn)
    }

    // Use requestIdleCallback for non-critical preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadCritical)
    } else {
      setTimeout(preloadCritical, 1000)
    }

    // Return cleanup function
    return () => {
      // Cleanup any pending operations if needed
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning={true}>
      {/* Session timeout modal */}
      <SessionTimeout sessionTimeoutHours={sessionTimeout} />
      
      {/* Desktop Sidebar (show only on xl and above to improve tablet landscape) */}
      <div className="hidden xl:fixed xl:inset-y-0 xl:flex xl:w-64" suppressHydrationWarning={true}>
        <StudentSidebar />
      </div>

      {/* Mobile Sidebar (use on tablet and below) */}
      <div className="xl:hidden" suppressHydrationWarning={true}>
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200" suppressHydrationWarning={true}>
          <div className="flex items-center space-x-2 min-w-0 flex-1" suppressHydrationWarning={true}>
            {branding.logoUrl ? (
              <div className="h-8 w-8 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                <img
                  src={branding.logoUrl}
                  alt="System Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning={true}>
                <span className="text-white font-apercu-bold text-sm">{systemInitials}</span>
              </div>
            )}
            <h1 className="font-apercu-bold text-base sm:text-lg text-gray-900 truncate">{branding.systemName}</h1>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0 ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 sm:w-72">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <StudentSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content (avoid sidebar padding on tablet landscape) */}
      <div className="xl:pl-64" suppressHydrationWarning={true}>
        <div className="flex flex-col min-h-screen" suppressHydrationWarning={true}>
          {/* Header */}
          {(title || description) && (
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <h1 className="text-2xl font-apercu-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </header>
          )}
          
          <main 
            ref={contentRef}
            className="flex-1 overflow-y-auto focus:outline-none"
            role="main"
            aria-label={title ? `${title} content` : 'Main content'}
          >
            <div className="py-6">
              <div className="px-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}