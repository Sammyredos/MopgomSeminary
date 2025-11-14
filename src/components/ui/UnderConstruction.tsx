'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle, Hammer, ChevronLeft, Home } from 'lucide-react'

interface UnderConstructionProps {
  title: string
  description?: string
  backHref?: string
  secondaryHref?: string
}

export function UnderConstruction({
  title,
  description = 'We’re actively building this page to serve you better.',
  backHref = '/student/dashboard',
  secondaryHref = '/student/courses',
}: UnderConstructionProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-3xl bg-white border border-emerald-200 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-emerald-100 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <Hammer className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-apercu-bold text-gray-900">
                Development In Progress
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-apercu-bold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-700">
                The <span className="font-apercu-medium">{title}</span> page is under construction. Please check back soon.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">Status: Building</Badge>
                <Badge variant="outline" className="text-emerald-700 border-emerald-200">ETA: TBD</Badge>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={backHref} className="no-underline">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                  </Button>
                </Link>
                <Link href={secondaryHref} className="no-underline">
                  <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Home className="h-4 w-4 mr-2" /> Explore Courses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}