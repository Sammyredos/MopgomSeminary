'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react'

interface SessionTimeoutProps {
  sessionTimeoutHours?: number
}

export function SessionTimeout({ sessionTimeoutHours = 1 }: SessionTimeoutProps) {
  const [showModal, setShowModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [extendError, setExtendError] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Always warn only at final 1 minute before expiry
  const sessionTimeoutMs = sessionTimeoutHours * 60 * 60 * 1000
  const warningTimeMs = 1 * 60 * 1000

  // FORCE LOGOUT - No mercy, no delays
  const forceLogout = useCallback(async () => {
    if (isLoggingOut) return // Prevent multiple calls

    setIsLoggingOut(true)
    setSessionExpired(true)

    // Clear all timers immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    try {
      // Call logout API (don't wait for response)
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Force redirect immediately
      window.location.href = '/login'
    } catch (error) {
      // Force redirect even if logout fails
      window.location.href = '/login'
    }
  }, [isLoggingOut])

  // Start session monitoring
  const startSessionMonitoring = useCallback(() => {
    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const sessionStartTime = Date.now()
    const sessionExpiryTime = sessionStartTime + sessionTimeoutMs

    // Background check every 5 seconds until we hit the warning threshold
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const remaining = sessionExpiryTime - now

      if (remaining <= 0) {
        forceLogout()
        return
      }

      // Show modal only when warning time is reached
      if (remaining <= warningTimeMs && !showModal) {
        setShowModal(true)
        setExtendError(null)
        setTimeRemaining(Math.max(0, Math.floor(remaining / 1000)))

        // Switch to 1-second countdown updates for accuracy
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        intervalRef.current = setInterval(() => {
          const nowTick = Date.now()
          const remainingTick = sessionExpiryTime - nowTick

          if (remainingTick <= 0) {
            forceLogout()
            return
          }

          setTimeRemaining(Math.max(0, Math.floor(remainingTick / 1000)))
        }, 1000)

        // Auto-logout when time reaches zero (failsafe)
        timeoutRef.current = setTimeout(() => {
          forceLogout()
        }, remaining)
      }
    }, 5000)
  }, [sessionTimeoutMs, warningTimeMs, showModal, forceLogout])

  // Extend session (use refresh endpoint; never auto-logout on failure)
  const extendSession = useCallback(async () => {
    if (isExtending || sessionExpired) return

    setIsExtending(true)
    setExtendError(null)
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        // Hide modal and restart monitoring with fresh cookie expiry
        setShowModal(false)
        setTimeRemaining(0)
        startSessionMonitoring()
      } else {
        // Keep user in session; show error and allow retry
        const data = await response.json().catch(() => ({}))
        setExtendError(data?.error || 'Could not extend session. Please try again.')
      }
    } catch (error) {
      // Network or other error — keep session and let user retry
      setExtendError('Network error while extending session. Please try again.')
    } finally {
      setIsExtending(false)
    }
  }, [isExtending, sessionExpired, startSessionMonitoring])

  // Initialize session monitoring
  useEffect(() => {
    startSessionMonitoring()

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [startSessionMonitoring])

  // Don't render anything if session has expired
  if (sessionExpired) {
    return null
  }

  // Don't render modal unless we are within the final minute
  if (!showModal || timeRemaining > 60) {
    return null
  }

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-gray-600">
              Your session will expire automatically
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-mono font-bold text-red-600">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          {extendError && (
            <p className="text-center text-sm text-red-600 mb-2">
              {extendError}
            </p>
          )}
          <p className="text-center text-sm text-gray-600">
            Click "Stay Logged In" to continue your session, or you'll be automatically logged out.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={forceLogout}
            variant="outline"
            className="flex-1"
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? 'Logging Out...' : 'Logout Now'}
          </Button>
          <Button
            onClick={extendSession}
            className="flex-1"
            disabled={isExtending || isLoggingOut}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isExtending ? 'animate-spin' : ''}`} />
            {isExtending ? 'Extending...' : 'Stay Logged In'}
          </Button>
        </div>
      </div>
    </div>
  )
}
