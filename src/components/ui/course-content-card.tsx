'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileText, Link as LinkIcon, Youtube, FileAudio, FileDigit } from 'lucide-react'

export type CourseContentType = 'youtube' | 'audio' | 'pdf' | 'link' | 'text'

export interface CourseContentCardProps {
  title: string
  subjectLabel?: string | null
  isPublished?: boolean
  description?: string | null
  contentType: CourseContentType
  url?: string | null
  className?: string
  children?: React.ReactNode
}

const iconForType = (t: CourseContentType) => {
  switch (t) {
    case 'youtube': return Youtube
    case 'audio': return FileAudio
    case 'pdf': return FileDigit
    case 'link': return LinkIcon
    case 'text': return FileText
    default: return FileText
  }
}

export function CourseContentCard({
  title,
  subjectLabel,
  isPublished,
  description,
  contentType,
  url,
  className,
  children
}: CourseContentCardProps) {
  const Icon = iconForType(contentType)
  const statusStyle = typeof isPublished === 'boolean'
    ? (isPublished ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200')
    : 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <div className={cn('bg-white border-2 border-[#efefef] shadow-sm rounded-2xl overflow-hidden', className)}>
      {/* Header styled like CourseCard with light green top background */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white flex-shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-apercu-bold text-base sm:text-md text-gray-900 truncate" title={title}>
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-apercu-medium text-xs px-2 py-1 capitalize">
                  {contentType}
                </Badge>
                {typeof isPublished === 'boolean' && (
                  <Badge className={`${statusStyle} font-apercu-medium text-xs px-2 py-1`}>
                    {isPublished ? 'Published' : 'Draft'}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {subjectLabel?.trim() || 'General'}
                </Badge>
              </div>
            </div>
          </div>
          {/* Right accent icon bubble (kept minimal) */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-white border border-gray-200 grid place-items-center">
              <Icon className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3">
        {description && (
          <p
            className="text-gray-700/80 text-sm leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {description}
          </p>
        )}
        {url && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="group bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          </Button>
        )}
        {children && (
          <div className="pt-1 flex items-center justify-end gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseContentCard