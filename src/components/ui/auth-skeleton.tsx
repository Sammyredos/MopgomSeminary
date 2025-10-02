'use client'

import { Skeleton } from '@/components/ui/skeleton'

// Authentication Form Skeleton for Admin Signup/Login pages
export function AuthFormSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-xl" />
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            {/* Card Header */}
            <div className="text-center mb-6">
              <Skeleton className="h-6 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-56 mx-auto" />
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Name Fields Row (for signup) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-18" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>

              {/* Email and Date of Birth Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>

              {/* Gender and Phone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-18" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>

              {/* Submit Button */}
              <Skeleton className="h-12 w-full rounded-xl" />

              {/* Footer Links */}
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simplified Login Form Skeleton
export function LoginFormSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-xl" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            {/* Card Header */}
            <div className="text-center mb-6">
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-44 mx-auto" />
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-18" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>

              {/* Submit Button */}
              <Skeleton className="h-12 w-full rounded-xl" />

              {/* Footer Links */}
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-40 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}