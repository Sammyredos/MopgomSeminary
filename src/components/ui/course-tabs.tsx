'use client'

import { cn } from '@/lib/utils'
import { BookOpen, Users, Clock, GraduationCap, Award, Calendar } from 'lucide-react'

interface CourseTab {
  id: string
  label: string
  count: number
  icon?: React.ComponentType<{ className?: string }>
}

interface CourseTabsProps {
  activeTab: string
  onTabChangeAction: (tab: string) => void
  tabs: CourseTab[]
  className?: string
}

export function CourseTabs({
  activeTab,
  onTabChangeAction,
  tabs,
  className,
  showCount = true,
  mobileActiveLabel = false
}: CourseTabsProps & { showCount?: boolean; mobileActiveLabel?: boolean }) {
  const getTabColor = (tabId: string) => {
    // Using indigo color scheme to match 'Add Course Subject' button
    return {
      active: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
      inactive: 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600'
    }
  }

  const getDefaultIcon = (tabId: string) => {
    switch (tabId) {
      case 'all':
        return BookOpen
      case 'active':
        return Users
      case 'inactive':
        return Clock
      case 'theology':
        return GraduationCap
      case 'ministry':
        return Award
      case 'biblical':
        return Calendar
      default:
        return BookOpen
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Course Tabs */}
      <div className="flex justify-between bg-gray-100 rounded-2xl p-1.5 shadow-inner overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const colors = getTabColor(tab.id)
          const IconComponent = tab.icon || getDefaultIcon(tab.id)
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChangeAction(tab.id)}
              className={cn(
                "flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 rounded-xl font-apercu-medium text-xs sm:text-sm transition-all duration-300 ease-in-out transform whitespace-nowrap min-w-fit",
                isActive
                  ? `${colors.active} scale-[1.02]`
                  : colors.inactive
              )}
            >
              <div className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0",
                isActive
                  ? "bg-white/20 backdrop-blur-sm"
                  : colors.iconBg
              )}>
                <IconComponent className={cn(
                  "h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 transition-all duration-300",
                  isActive ? "text-white" : colors.iconColor
                )} />
              </div>
              <div className="flex flex-col items-start min-w-0 hidden xs:flex">
                <span className={cn(
                  "font-apercu-bold text-xs sm:text-sm truncate",
                  isActive ? "text-white" : colors.iconColor
                )}>
                  {tab.label}
                </span>
                {showCount && (
                  <span className={cn(
                    "text-xs font-apercu-regular",
                    isActive ? "text-white" : colors.iconColor.replace('600', '500')
                  )}>
                    {tab.count} course{tab.count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {/* Mobile: Show only count on very small screens */}
              {showCount && (
                <div className="flex xs:hidden max-w-[140px]">
                  <span className={cn(
                    "text-xs font-apercu-medium truncate",
                    isActive ? "text-white" : colors.iconColor
                  )}>
                    {mobileActiveLabel && isActive ? tab.label : String(tab.count)}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface CourseTabContentProps {
  activeTab: string
  children: React.ReactNode
  className?: string
}

export function CourseTabContent({
  activeTab,
  children,
  className
}: CourseTabContentProps) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300",
      className
    )}>
      {children}
    </div>
  )
}