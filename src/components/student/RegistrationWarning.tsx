'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Minimal: no badge or progress bar
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { RegistrationCompletionStatus } from '@/utils/registrationCompletion'

interface RegistrationWarningProps {
  completionStatus: RegistrationCompletionStatus
  className?: string
}

// Simplified notice: no per-step listing

export function RegistrationWarning({ completionStatus, className = '' }: RegistrationWarningProps) {
  // Don't show warning if registration is complete
  if (completionStatus.isComplete) {
    return null
  }

  return (
    <Card data-slot="card" className={`text-card-foreground flex flex-col gap-6 rounded-xl border border-amber-200 bg-amber-50 shadow-lg py-0 ${className}`}>
      <CardContent data-slot="card-content" className="px-4 sm:px-6 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2" />

          <p className="text-amber-700 mb-2 text-sm">
            Complete your profile to receive your <span className="font-semibold text-amber-700">Matriculation Number</span>.
          </p>

          {/* Minimal: removed progress bar */}

          {/* Simplified: no per-section breakdown */}

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/student/profile">
                <Button
                  data-slot="button"
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive relative overflow-hidden hover:-translate-y-0.5 active:translate-y-0 hover:shadow-lg shadow-xs focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-8 px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Go to Profile
                </Button>
            </Link>
            {/* Minimal: remove extra helper text */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RegistrationWarning