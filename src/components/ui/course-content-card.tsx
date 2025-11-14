'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
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
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200', className)}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-apercu-bold text-gray-900 truncate" title={title}>
              {title}
            </div>
            {typeof isPublished === 'boolean' && (
              <Badge variant="outline" className={`text-[10px] ${isPublished ? 'border-green-200 text-green-700' : 'border-yellow-200 text-yellow-700'}`}>{isPublished ? 'Published' : 'Draft'}</Badge>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-gray-500">{subjectLabel?.trim() || 'General'}</div>
          {description && (
            <div
              className="mt-1 text-xs text-gray-600"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {description}
            </div>
          )}
          {url && (
            <a
              href={url}
              className="mt-2 inline-block text-xs text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Link
            </a>
          )}
          {children && (
            <div className="mt-3 flex items-center justify-end gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseContentCard