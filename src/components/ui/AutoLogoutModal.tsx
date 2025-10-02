'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'

interface AutoLogoutModalProps {
  isOpen: boolean
  timeRemaining: number // in seconds
  onExtendSession: () => void
  onLogoutNow: () => void
}

export function AutoLogoutModal({
  isOpen,
  timeRemaining,
  onExtendSession,
  onLogoutNow
}: AutoLogoutModalProps) {
  const [countdown, setCountdown] = useState(timeRemaining)

  useEffect(() => {
    setCountdown(timeRemaining)
  }, [timeRemaining])

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getUrgencyColor = (seconds: number) => {
    if (seconds <= 60) return 'text-red-600' // Last minute - red
    if (seconds <= 180) return 'text-orange-600' // Last 3 minutes - orange
    return 'text-yellow-600' // Default warning - yellow
  }

  const getProgressWidth = (seconds: number, total: number) => {
    return Math.max(0, (seconds / total) * 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Session Timeout Warning</span>
          </DialogTitle>
          <DialogDescription>
            Your session will expire soon due to inactivity. You will be automatically logged out for security reasons.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown Display */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className={`h-6 w-6 ${getUrgencyColor(countdown)}`} />
              <span className={`text-2xl font-bold ${getUrgencyColor(countdown)}`}>
                {formatTime(countdown)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Time remaining until automatic logout
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                countdown <= 60 
                  ? 'bg-red-500' 
                  : countdown <= 180 
                  ? 'bg-orange-500' 
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${getProgressWidth(countdown, timeRemaining)}%` }}
            />
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Security Notice:</strong> To protect your account and data, 
              you will be automatically logged out when the timer reaches zero.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            onClick={onLogoutNow}
            variant="outline"
            className="font-apercu-medium"
          >
            Logout Now
          </Button>
          <Button
            onClick={onExtendSession}
            className="font-apercu-medium bg-indigo-600 hover:bg-indigo-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Stay Logged In</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}