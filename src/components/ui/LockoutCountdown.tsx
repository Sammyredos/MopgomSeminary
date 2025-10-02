'use client'

import { useState, useEffect } from 'react'
import { Clock, Shield } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LockoutCountdownProps {
  lockoutEndTime: Date
  onCountdownComplete?: () => void
  className?: string
}

export function LockoutCountdown({ 
  lockoutEndTime, 
  onCountdownComplete, 
  className = '' 
}: LockoutCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const endTime = lockoutEndTime.getTime()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
      
      setTimeRemaining(remaining)
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true)
        onCountdownComplete?.()
      }
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [lockoutEndTime, onCountdownComplete, isExpired])

  const formatTime = (seconds: number): string => {
    return `${seconds} seconds`
  }

  if (isExpired) {
    return (
      <Alert variant="default" className={`border-green-200 bg-green-50 ${className}`}>
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="font-apercu-medium text-green-700">
          Account lockout has expired. You can now try logging in again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className={`border-red-200 bg-red-50 ${className}`}>
      <Clock className="h-4 w-4 text-red-600" />
      <AlertDescription className="font-apercu-medium text-red-700">
        <div className="flex flex-col gap-2">
          <div>
            Account temporarily locked due to too many failed attempts.
          </div>
          <div className="flex items-center gap-2">
            <span>Try again in:</span>
            <span className="font-mono text-md font-bold text-red-800 bg-red-100 px-2 py-1 rounded">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Helper function to parse lockout time from API response
export function parseLockoutTime(errorMessage: string, lockoutTime?: string | number): Date | null {
  if (!lockoutTime) return null
  
  try {
    // If lockoutTime is a number (seconds), use it directly
    if (typeof lockoutTime === 'number') {
      return new Date(Date.now() + lockoutTime * 1000)
    }
    
    // If lockoutTime is a string, try to parse it as a date
    return new Date(lockoutTime)
  } catch {
    // Fallback: try to extract seconds from error message
    const secondsMatch = errorMessage.match(/Try again in (\d+) seconds?/)
    if (secondsMatch) {
      const seconds = parseInt(secondsMatch[1])
      return new Date(Date.now() + seconds * 1000)
    }
    
    // Fallback: try to extract minutes from error message (for backward compatibility)
    const minutesMatch = errorMessage.match(/Try again in (\d+) minutes?/)
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1])
      return new Date(Date.now() + minutes * 60 * 1000)
    }
    return null
  }
}