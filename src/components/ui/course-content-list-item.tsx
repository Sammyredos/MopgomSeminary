"use client"

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Link as LinkIcon, Headphones, PlayCircle, Type } from 'lucide-react'

type ContentType = 'youtube' | 'audio' | 'pdf' | 'link' | 'text'

export interface CourseContentListItemProps {
  id: string
  title: string
  subjectLabel?: string | null
  contentType: ContentType
  description?: string | null
  url?: string | null
  className?: string
  showDescription?: boolean
}

const typeLabel = (t: ContentType) => t.charAt(0).toUpperCase() + t.slice(1)

export function CourseContentListItem({
  id,
  title,
  subjectLabel,
  contentType,
  description,
  url,
  className,
  showDescription = true
}: CourseContentListItemProps) {
  const isPdf = contentType === 'pdf'
  const Icon = (
    contentType === 'pdf' ? FileText :
    contentType === 'link' ? LinkIcon :
    contentType === 'audio' ? Headphones :
    contentType === 'youtube' ? PlayCircle :
    Type
  )

  return (
    <div
      data-id={id}
      className={cn(
        'w-[300px] sm:w-full mx-auto rounded-lg p-3 bg-white',
        'shadow-sm hover:shadow-md transition-shadow',
        'ring-1 ring-emerald-100 border border-emerald-200',
        'hover:bg-emerald-50/40',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div className="text-sm font-apercu-medium text-gray-900 flex-1 break-words whitespace-normal leading-snug overflow-hidden">{title}</div>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
              {typeLabel(contentType)}
            </Badge>
            {subjectLabel && (
              <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
                {subjectLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {showDescription && description ? (
        <p className="mt-2 text-xs text-gray-600 line-clamp-2">{description}</p>
      ) : null}

      <div className="mt-2">
        {url ? (
          isPdf ? (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm w-full">
              <Link
                href={`/student/content/viewer?url=${encodeURIComponent(url!)}&title=${encodeURIComponent(title)}&subject=${encodeURIComponent(subjectLabel || 'General')}`}
                prefetch={false}
              >
                Open
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm w-full">
              <a href={url as string} target="_blank" rel="noopener noreferrer">Open</a>
            </Button>
          )
        ) : (
          <Badge variant="outline" className="text-[11px] bg-gray-50 text-gray-600 border-gray-200">No link provided</Badge>
        )}
      </div>
    </div>
  )
}

export default CourseContentListItem