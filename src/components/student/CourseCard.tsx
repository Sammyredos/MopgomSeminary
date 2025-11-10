'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GraduationCap, Users, Clock, ChevronRight, UserCircle2 } from 'lucide-react'

export interface CourseCardProps {
  id: string
  courseCode: string
  courseName: string
  subjectArea: string
  instructor?: string
  description?: string
  isActive?: boolean
  onViewDetails?: (id: string) => void
  programLabel?: string
  maxStudents?: number
  currentEnrollment?: number
  nextActivity?: string
}

/**
 * CourseCard (Student)
 * Replicates a modern "room/card" UI with:
 * - prominent icon block
 * - title, code badge, and subject area tag
 * - compact stats row (instructor, status)
 * - CTA action
 *
 * Design goals:
 * - enterprise-ready, readable, and scalable
 * - isolated, reusable UI component (logic-free)
 */
export function CourseCard({
  id,
  courseCode,
  courseName,
  subjectArea,
  instructor,
  description,
  isActive = true,
  onViewDetails,
  programLabel,
  maxStudents,
  currentEnrollment,
  nextActivity
}: CourseCardProps) {
  const statusStyle = isActive
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-red-100 text-red-800 border-red-200'
  const remaining = typeof maxStudents === 'number' && typeof currentEnrollment === 'number'
    ? Math.max(maxStudents - currentEnrollment, 0)
    : undefined
  return (
    <Card className="bg-white border-2 border-[#efefef] shadow-sm rounded-2xl overflow-hidden">
      {/* Header styled to mirror Platoon Alpha */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white flex-shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {/* Title line */}
              <h3 className="font-apercu-bold text-base sm:text-md text-gray-900 truncate capitalize" title={courseName}>
                {courseName}
              </h3>

              {/* Code + Status line */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {courseCode && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-apercu-medium text-xs px-2 py-1 uppercase">
                    {courseCode}
                  </Badge>
                )}
                <Badge className={`${statusStyle} font-apercu-medium text-xs px-2 py-1`}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Compact status icons (Alpha style) */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-white border border-gray-200 grid place-items-center">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="h-9 w-9 rounded-full bg-white border border-gray-200 grid place-items-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Info badges (leader/instructor, code, subject, next activity) */}
        <div className="flex flex-wrap items-center gap-2">
          {instructor && (
            <Badge variant="outline" className="text-xs">
              <UserCircle2 className="h-3 w-3 mr-1" />Instructor: {instructor}
            </Badge>
          )}
          {/* Removed course code badge from body per request */}
          {subjectArea && (
            <Badge variant="outline" className="text-xs capitalize">
              {subjectArea}
            </Badge>
          )}
          {nextActivity && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />Next: {nextActivity}
            </Badge>
          )}
        </div>

        {/* Stats or Description */}
        <div className="text-sm text-gray-700">
          {typeof maxStudents === 'number' && typeof currentEnrollment === 'number' ? (
            <span className="inline-flex items-center"><Users className="h-4 w-4 mr-1 text-emerald-600" />{currentEnrollment}/{maxStudents} enrolled{remaining !== undefined ? ` · ${remaining} slots open` : ''}</span>
          ) : (
            <p
              className="text-gray-700/80 text-sm leading-relaxed"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {description ? description : 'No description provided.'}
            </p>
          )}
        </div>

        {/* CTA on next line */}
        <div className="pt-3">
          <Button
            size="sm"
            variant="outline"
            className="group bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
            onClick={() => onViewDetails?.(id)}
          >
            Explore Course Content
            <ChevronRight className="h-4 w-4 ml-1 text-white/90 group-hover:text-white" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}