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
  /**
   * Optional actions to render in the card header (top-right).
   * Use this to place Open / Open Secure Viewer buttons in the header.
   */
  actions?: React.ReactNode
  /**
   * Optional actions to render inside the card body, centered.
   * Use this for student-facing Open buttons to match attached UI.
   */
  actionsBody?: React.ReactNode
  /**
   * Control visibility of the published/draft status badge.
   * Defaults to true for admin views; set false for student views.
   */
  showStatusBadge?: boolean
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
  children,
  actions,
  actionsBody,
  showStatusBadge = true
}: CourseContentCardProps) {
  const Icon = iconForType(contentType)
  const statusStyle = typeof isPublished === 'boolean'
    ? (isPublished ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200')
    : 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <div className={cn('bg-white border-2 border-[#efefef] shadow-sm rounded-2xl overflow-hidden', className)}>
      {/* Header styled to match attached UI with soft green background */}
      <div className="p-4 sm:p-5 border-b border-emerald-100 bg-emerald-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white flex-shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-apercu-bold text-base sm:text-md text-gray-900 truncate break-words" title={title}>
                {title}
              </h3>
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                {/* Primary content type badge (e.g., Pdf) */}
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-apercu-medium text-xs px-2 py-1 capitalize">
                  {contentType}
                </Badge>
                {showStatusBadge && typeof isPublished === 'boolean' && (
                  <Badge className={`${statusStyle} font-apercu-medium text-xs px-2 py-1`}>
                    {isPublished ? 'Published' : 'Draft'}
                  </Badge>
                )}
                {/* Secondary label badge (e.g., Full Course Dump) */}
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-apercu-medium text-xs px-2 py-1 capitalize">
                  {subjectLabel?.trim() || 'General'}
                </Badge>
              </div>
            </div>
          </div>
          {/* Header actions (top-right) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions ? (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            ) : (
              // Fallback: if url provided and no actions and no body actions, show Open in header
              !actionsBody && url && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="group bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">Open</a>
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-4 space-y-4">
        {description && (
          <p
            className="text-gray-700/80 text-sm leading-relaxed break-words"
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
        {/* Children can render additional content (not actions) */}
        {children}
        {/* Optional centered actions in body to match attached UI */}
        {actionsBody && (
          <div className="pt-2 flex items-center justify-center">
            {actionsBody}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseContentCard