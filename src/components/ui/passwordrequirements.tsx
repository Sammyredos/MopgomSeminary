'use client'

import React, { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PasswordRequirement {
  id: string
  text: string
  validator: (password: string) => boolean
  met: boolean
}

interface PasswordRequirementsProps {
  password: string
  className?: string
}

export function PasswordRequirements({ password, className = '' }: PasswordRequirementsProps) {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([])
  const [loading, setLoading] = useState(true)

  // Load password requirements from settings
  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const { SecurityValidator } = await import('@/lib/security')
        const settings = await SecurityValidator.getPasswordRequirements()
        
        const requirementsList: PasswordRequirement[] = [
          {
            id: 'length',
            text: `At least ${settings.minLength} characters long`,
            validator: (pwd: string) => pwd.length >= settings.minLength,
            met: false
          }
        ]

        if (settings.requireStrong) {
          requirementsList.push(
            {
              id: 'uppercase',
              text: 'Contains at least one uppercase letter',
              validator: (pwd: string) => /[A-Z]/.test(pwd),
              met: false
            },
            {
              id: 'lowercase',
              text: 'Contains at least one lowercase letter',
              validator: (pwd: string) => /[a-z]/.test(pwd),
              met: false
            },
            {
              id: 'number',
              text: 'Contains at least one number',
              validator: (pwd: string) => /\d/.test(pwd),
              met: false
            },
            {
              id: 'special',
              text: 'Contains at least one special character (!@#$%^&*(),.?":{}|<>)',
              validator: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
              met: false
            }
          )
        }

        setRequirements(requirementsList)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load password requirements:', error)
        // Fallback to basic requirements
        setRequirements([
          {
            id: 'length',
            text: 'At least 8 characters long',
            validator: (pwd: string) => pwd.length >= 8,
            met: false
          },
          {
            id: 'uppercase',
            text: 'Contains at least one uppercase letter',
            validator: (pwd: string) => /[A-Z]/.test(pwd),
            met: false
          },
          {
            id: 'lowercase',
            text: 'Contains at least one lowercase letter',
            validator: (pwd: string) => /[a-z]/.test(pwd),
            met: false
          },
          {
            id: 'number',
            text: 'Contains at least one number',
            validator: (pwd: string) => /\d/.test(pwd),
            met: false
          },
          {
            id: 'special',
            text: 'Contains at least one special character (!@#$%^&*(),.?":{}|<>)',
            validator: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
            met: false
          }
        ])
        setLoading(false)
      }
    }

    loadRequirements()
  }, [])

  // Update requirement validation in real-time
  useEffect(() => {
    if (!loading && requirements.length > 0) {
      setRequirements(prevRequirements =>
        prevRequirements.map(req => ({
          ...req,
          met: req.validator(password)
        }))
      )
    }
  }, [password, loading, requirements.length])

  if (loading) {
    return (
      <Card className={`bg-blue-50 border-blue-200 ${className}`}>
        <CardContent className="py-4 px-4">
          <h4 className="font-apercu-bold text-sm text-blue-800 mb-3">Password Requirements:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-48"></div>
            </div>
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-40"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-blue-50 border-blue-200 ${className}`}>
      <CardContent className="py-4 px-4">
        <h4 className="font-apercu-bold text-sm text-blue-800 mb-3">Password Requirements:</h4>
        <div className="space-y-2">
          {requirements.map((requirement) => (
            <div key={requirement.id} className="flex items-start gap-2">
              <div className={`flex-shrink-0 w-4 h-4 rounded-sm border-2 flex items-center justify-center mt-0.5 transition-all duration-200 ${
                requirement.met
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 bg-white'
              }`}>
                {requirement.met ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={`text-xs font-apercu-medium transition-colors duration-200 ${
                requirement.met
                  ? 'text-green-700'
                  : 'text-gray-600'
              }`}>
                {requirement.text}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PasswordRequirements