/**
 * Reusable Stats Card Component with consistent design
 * Optimized for better text handling and minimalistic design
 */

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  gradient: string
  bgGradient: string
  loading?: boolean
  href?: string
  onClick?: () => void
  ariaLabel?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  bgGradient,
  loading = false,
  href,
  onClick,
  ariaLabel
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={`relative overflow-hidden border border-gray-200 shadow-sm ${bgGradient || 'bg-white'}`}>
        <div className="p-4 sm:p-5">
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const inner = (
    <Card className={`relative overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group ${bgGradient || 'bg-white'} ${href || onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`h-8 w-8 sm:h-10 sm:w-10 ${gradient} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-apercu-regular text-xs sm:text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">
              {title}
            </p>
            <p className="font-apercu-bold text-lg sm:text-xl lg:text-2xl text-gray-900 leading-tight truncate">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="font-apercu-regular text-xs sm:text-xs text-gray-600 mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel || title} className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg no-underline hover:no-underline">
        {inner}
      </Link>
    )
  }

  return inner
}

interface StatsGridProps {
  children: React.ReactNode
  columns?: 'auto' | 2 | 3 | 4 | 6
}

export function StatsGrid({ children, columns = 6 }: StatsGridProps) {
  const gridClass = columns === 'auto'
    ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full'
    : columns === 2
    ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 w-full'
    : columns === 3
    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 w-full'
    : columns === 4
    ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 w-full'

  return (
    <div className={`${gridClass} mb-6`}>
      {children}
    </div>
  )
}
