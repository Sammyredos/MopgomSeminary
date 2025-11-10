'use client'

import { cn } from '@/lib/utils'
import { ButtonSkeleton } from '@/components/ui/skeleton'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg">
      {/* Course Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Icon skeleton */}
          <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {/* Course name skeleton */}
            <Skeleton className="h-5 w-3/4 mb-2" />
            {/* Badges skeleton */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            {/* Course code skeleton */}
            <div className="mt-2 w-full">
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>

        {/* Action button spinner placeholder */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <ButtonSkeleton size="sm" className="w-8" />
        </div>
      </div>

      {/* Course Description */}
      <div className="mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      {/* Course Info */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <Skeleton className="h-4 w-4 flex-shrink-0" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Sessions info skeleton */}
        <div className="flex items-center space-x-2 mb-3">
          <Skeleton className="h-4 w-4 flex-shrink-0" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

export function CourseListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  )
}