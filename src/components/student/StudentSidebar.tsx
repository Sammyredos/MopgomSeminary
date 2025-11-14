'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useBranding } from '@/contexts/BrandingContext'
import { useUser } from '@/contexts/UserContext'
import { useSafeTranslation } from '@/contexts/LanguageContext'
import { useMessages } from '@/contexts/MessageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useProgress } from '@/hooks/useProgress'
import { SidebarLogo } from '@/components/ui/UniversalLogo'

import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  LogOut,
  User,
  Award,
  TrendingUp,
  Bell,
  GraduationCap,
  Users,
  Home
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge: string | null
  description?: string
  group?: string
}

const getNavigation = (t: (key: string) => string): NavigationItem[] => [
  // Main Dashboard
  {
    name: t('nav.dashboard') || 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard,
    badge: null,
    description: 'Overview and quick access',
    group: 'main'
  },

  // Academic
  {
    name: 'My Courses',
    href: '/student/courses',
    icon: BookOpen,
    badge: null,
    description: 'View enrolled courses',
    group: 'academic'
  },
  {
    name: 'Grades',
    href: '/student/grades',
    icon: Award,
    badge: null,
    description: 'Academic performance',
    group: 'academic'
  },
  {
    name: 'Assignments',
    href: '/student/assignments',
    icon: FileText,
    badge: null,
    description: 'Homework and projects',
    group: 'academic'
  },

  // Scheduling
  {
    name: 'Schedule',
    href: '/student/schedule',
    icon: Clock,
    badge: null,
    description: 'Class timetable',
    group: 'scheduling'
  },
  {
    name: 'Calendar',
    href: '/student/calendar',
    icon: Calendar,
    badge: null,
    description: 'Events and deadlines',
    group: 'scheduling'
  },

  // Communications
  {
    name: 'Messages',
    href: '/student/messages',
    icon: MessageSquare,
    badge: null,
    description: 'Communication hub',
    group: 'communications'
  },

  // Personal
  {
    name: 'Profile',
    href: '/student/profile',
    icon: User,
    badge: null,
    description: 'Personal information',
    group: 'personal'
  }
]

export function StudentSidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { branding, isLoading } = useBranding()
  const { currentUser, loading: isLoadingUser } = useUser()
  const { t } = useSafeTranslation()
  const { stats: messageStats } = useMessages()
  const { startProgress } = useProgress()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Don't render sidebar if user is not authenticated or not a student
  if (!isLoadingUser && (!currentUser || currentUser.role?.name !== 'Student')) {
    return null
  }

  const handleNavigation = (href: string) => {
    if (pathname !== href) {
      startProgress()
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return // Prevent multiple clicks

    try {
      setIsLoggingOut(true)
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login?logout=true'
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false) // Reset on error
    }
  }

  // Memoize filtered navigation to prevent unnecessary re-renders
  const dynamicNavigation = useMemo(() => {
    if (!isHydrated) return []

    const navigation = getNavigation(t)
    
    // Add dynamic badges for messages
    return navigation.map(item => {
      if (item.href === '/student/messages') {
        return {
          ...item,
          badge: messageStats.unread > 0 ? messageStats.unread.toString() : null
        }
      }
      return item
    })
  }, [messageStats.unread, t, isHydrated])

  // Generate user initials
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  try {
    return (
      <div className={cn('flex h-full w-64 flex-col bg-white border-r md:border-r-0 lg:border-r border-gray-200', className)} suppressHydrationWarning={true}>
        {/* Logo */}
        <div className="flex h-16 items-center px-4 border-b border-gray-200" suppressHydrationWarning={true}>
          <div className="flex items-center space-x-2" suppressHydrationWarning={true}>
            <SidebarLogo
              fallbackText={branding.systemName.charAt(0) || 'M'}
              className="rounded-lg border border-gray-200"
            />
            <div suppressHydrationWarning={true}>
              {isLoading ? (
                // Skeleton loader for system name and subtitle
                <div suppressHydrationWarning={true}>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" suppressHydrationWarning={true} />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" suppressHydrationWarning={true} />
                </div>
              ) : (
                <>
                  <h1 className="font-apercu-bold text-lg text-gray-900">{branding.systemName}</h1>
                  <p className="font-apercu-regular text-xs text-gray-500">Student Portal</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {isLoadingUser ? (
            // Skeleton loader for navigation
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 px-3 py-2.5" suppressHydrationWarning={true}>
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" suppressHydrationWarning={true} />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" suppressHydrationWarning={true} />
              </div>
            ))
          ) : (
            (() => {
              let lastGroup = ''
              return dynamicNavigation.map((item, index) => {
                // Mark link active for exact path or nested routes under it
                // Mark 'My Courses' active for nested routes and the secure viewer context
                const isCoursesItem = item.href === '/student/courses'
                const isCoursesContext = pathname === '/student/content/viewer' || pathname.startsWith('/student/content')
                const isActive = isCoursesItem
                  ? (pathname === item.href || pathname.startsWith(item.href + '/') || isCoursesContext)
                  : (pathname === item.href || pathname.startsWith(item.href + '/'))
                const showSeparator = item.group !== lastGroup && index > 0
                lastGroup = item.group || ''
                
                return (
                  <div key={item.name}>
                    {showSeparator && (
                      <div className="py-2">
                        <Separator className="bg-gray-200" />
                      </div>
                    )}
                    <Link
                      href={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 text-sm font-apercu-medium rounded-lg transition-colors duration-150 hover:scale-[1.02] active:scale-[0.98] no-underline hover:no-underline mb-1',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className={cn(
                          'h-5 w-5 transition-colors duration-150',
                          isActive ? 'text-indigo-600' : 'text-gray-400'
                        )} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <Badge
                          variant="info"
                          className="h-5 px-2 text-xs font-apercu-medium flex-shrink-0 ml-2"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </div>
                )
              })
            })()
          )}
        </nav>

        <div className="px-3 sm:px-4" suppressHydrationWarning={true}>
          <Separator />
        </div>

        {/* User section */}
        <div className="p-4 flex-shrink-0" suppressHydrationWarning={true}>
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4" suppressHydrationWarning={true}>
            {isLoadingUser ? (
              // Skeleton loader for user avatar
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" suppressHydrationWarning={true} />
            ) : (
              <div className="h-10 w-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-apercu-bold text-sm">
                  {currentUser ? getUserInitials(currentUser.name) : 'S'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0" suppressHydrationWarning={true}>
              {isLoadingUser ? (
                // Skeleton loader for user info
              <div suppressHydrationWarning={true}>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" suppressHydrationWarning={true} />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mb-1" suppressHydrationWarning={true} />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" suppressHydrationWarning={true} />
              </div>
              ) : (
                <>
                  <p className="font-apercu-medium text-sm text-gray-900 truncate">
                    {currentUser?.name || 'Student'}
                  </p>
                  <p className="font-apercu-regular text-xs text-gray-500 truncate">
                    {currentUser?.email || ''}
                  </p>
                  {currentUser?.role && (
                    <p className="font-apercu-regular text-xs text-indigo-600 truncate">
                      {currentUser.role.name}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Logout Button */}
          {isLoadingUser ? (
            // Skeleton loader for logout button
            <div className="h-8 sm:h-9 w-full bg-gray-200 rounded animate-pulse" suppressHydrationWarning={true} />
          ) : (
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              size="sm"
              className="w-full h-8 sm:h-9 font-apercu-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Signing Out...</span>
                  <span className="sm:hidden">Signing Out</span>
                </>
              ) : (
                <>
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Sign Out</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('StudentSidebar render error:', error)
    return (
      <div className={cn('flex h-full w-64 flex-col bg-white border-r md:border-r-0 lg:border-r border-gray-200', className)}>
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-apercu-bold text-lg text-gray-900">Student Portal</h1>
              <p className="font-apercu-regular text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading sidebar...</p>
        </div>
      </div>
    )
  }
}