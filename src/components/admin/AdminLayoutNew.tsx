'use client'

import { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Menu } from 'lucide-react'
import { SessionTimeout } from '@/components/SessionTimeout'
import { UniversalUserAccess } from './UniversalUserAccess'
import { useBranding } from '@/contexts/BrandingContext'
import { DynamicTitle } from './DynamicTitle'
import { DynamicFavicon } from './DynamicFavicon'
import { useEffect, useState } from 'react'


interface AdminLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

function AdminLayoutContent({ children, title, description }: AdminLayoutProps) {
  const { branding } = useBranding()
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

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning={true}>


      {/* Dynamic title and favicon components */}
      <DynamicTitle pageTitle={title} />
      <DynamicFavicon />

      {/* Desktop Sidebar (show only on xl and above to improve tablet landscape) */}
      <div className="hidden xl:fixed xl:inset-y-0 xl:flex xl:w-64" suppressHydrationWarning={true}>
        <AdminSidebar />
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
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0" suppressHydrationWarning={true}>
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
              <AdminSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content (avoid sidebar padding on tablet landscape) */}
      <div className="xl:pl-64" suppressHydrationWarning={true}>
        <div className="flex flex-col min-h-screen" suppressHydrationWarning={true}>
          {/* Header */}
          {(title || description) && (
            <header className="bg-white border-b border-gray-200">
              <div className="px-6 py-6" suppressHydrationWarning={true}>
                <div className="flex items-start justify-between" suppressHydrationWarning={true}>
                  <div className="flex-1" suppressHydrationWarning={true}>
                    {title && (
                      <h1 className="font-apercu-bold text-2xl text-gray-900 mb-1">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="font-apercu-regular text-gray-600">
                        {description}
                      </p>
                    )}
                  </div>
                  <div className="ml-6" suppressHydrationWarning={true}>
                    <UniversalUserAccess variant="compact" />
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Page Content */}
          <main className="flex-1 py-6">
            {children}
          </main>
        </div>
      </div>

      {/* Session Timeout Component */}
      <SessionTimeout sessionTimeoutHours={sessionTimeout} />
    </div>
  )
}

export function AdminLayoutNew({ children, title, description }: AdminLayoutProps) {
  return (
    <AdminLayoutContent title={title} description={description}>
      {children}
    </AdminLayoutContent>
  )
}

export default AdminLayoutNew
