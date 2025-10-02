'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle, ExternalLink, User, Home, Briefcase, GraduationCap, Heart } from 'lucide-react'
import Link from 'next/link'
import { RegistrationCompletionStatus, getFieldDisplayName } from '@/utils/registrationCompletion'

interface RegistrationWarningProps {
  completionStatus: RegistrationCompletionStatus
  className?: string
}

const stepIcons = {
  personal: User,
  contact: Home,
  professional: Briefcase,
  education: GraduationCap,
  spiritual: Heart
}

export function RegistrationWarning({ completionStatus, className = '' }: RegistrationWarningProps) {
  // Don't show warning if registration is complete
  if (completionStatus.isComplete) {
    return null
  }

  const incompleteSteps = completionStatus.steps.filter(step => !step.completed)

  return (
    <Card className={`border-amber-200 bg-amber-50 shadow-lg ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-amber-800">
                Complete Your Registration
              </h3>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {completionStatus.completionPercentage}% Complete
              </Badge>
            </div>
            
            <p className="text-amber-700 mb-4">
              Your profile is incomplete. Please complete the following sections to finish your registration:
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-amber-700 mb-2">
                <span>Progress</span>
                <span>{completionStatus.completedSteps} of {completionStatus.totalSteps} sections completed</span>
              </div>
              <Progress 
                value={completionStatus.completionPercentage} 
                className="h-2 bg-amber-100"
              />
            </div>

            {/* Incomplete Steps */}
            <div className="space-y-3 mb-4">
              {incompleteSteps.map((step) => {
                const IconComponent = stepIcons[step.id as keyof typeof stepIcons] || User
                
                return (
                  <div key={step.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-amber-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600">
                          {step.missingFields.length} field{step.missingFields.length !== 1 ? 's' : ''} missing
                        </p>
                        {step.missingFields.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs text-gray-500">
                              Missing: {step.missingFields.map(field => getFieldDisplayName(field)).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        Incomplete
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/student/profile" className="flex-1">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Complete Your Profile
                </Button>
              </Link>
              <div className="text-center sm:text-right">
                <p className="text-xs text-amber-600 mt-2 sm:mt-0">
                  This warning will disappear once your profile is complete
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RegistrationWarning