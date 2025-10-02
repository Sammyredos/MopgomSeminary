'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react'

interface SessionTimeoutProps {
  sessionTimeoutHours?: number
}

export function SessionTimeout({ sessionTimeoutHours = 1 }: SessionTimeoutProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [showModal, setShowModal] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Dynamic warning threshold based on session timeout
  // For sessions <= 2 minutes: warn at 50% of session time (minimum 30 seconds)
  // For sessions > 2 minutes: warn 1 minute before expiry
  const sessionTimeoutMs = sessionTimeoutHours * 60 * 60 * 1000
  const warningTimeMs = sessionTimeoutMs <= 2 * 60 * 1000 
    ? Math.max(sessionTimeoutMs * 0.5, 30 * 1000) // At least 30 seconds warning
    : 1 * 60 * 1000 // 1 minute for longer sessions

  console.log('SessionTimeout Debug:')
  console.log('- sessionTimeoutHours:', sessionTimeoutHours)
  console.log('- sessionTimeoutMs:', sessionTimeoutMs)
  console.log('- warningTimeMs:', warningTimeMs)
  console.log('- warningTimeMs (seconds):', warningTimeMs / 1000)

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

      // Clear all local storage and cookies immediately
      localStorage.clear()
      sessionStorage.clear()

      // Force redirect based on current path
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login?logout=true'
      } else {
        window.location.href = '/login?logout=true'
      }
    } catch (error) {
      console.error('Force logout error:', error)
      // Even if API fails, force redirect based on current path
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login?logout=true'
      } else {
        window.location.href = '/login?logout=true'
      }
    }
  }, [isLoggingOut])

  // SESSION MONITORING - The real deal
  const startSessionMonitoring = useCallback(() => {
    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    // Calculate session start time and expiry based on configured timeout
    const sessionStartTime = Date.now()
    const sessionExpiryTime = sessionStartTime + sessionTimeoutMs
    
    console.log('Starting session monitoring:')
    console.log('- Session timeout:', sessionTimeoutHours, 'hours')
    console.log('- Session timeout (ms):', sessionTimeoutMs)
    console.log('- Warning threshold (ms):', warningTimeMs)
    console.log('- Session will expire at:', new Date(sessionExpiryTime).toLocaleTimeString())

    const checkSession = async () => {
      try {
        // First verify the token is still valid
        const tokenResponse = await fetch('/api/auth/token-info')
        if (!tokenResponse.ok) {
          console.error('Token info failed:', tokenResponse.status)
          forceLogout()
          return
        }

        // Calculate remaining time based on our configured timeout
        const now = Date.now()
        const remaining = sessionExpiryTime - now

        console.log('Session check - remaining time:', Math.floor(remaining / 1000), 'seconds')
        console.log('Warning threshold:', Math.floor(warningTimeMs / 1000), 'seconds')
        console.log('Should show modal?', remaining <= warningTimeMs, 'showModal:', showModal)

        if (remaining <= 0) {
          // SESSION EXPIRED - FORCE LOGOUT IMMEDIATELY
          console.log('Session expired - forcing logout')
          forceLogout()
          return
        }

        setTimeLeft(remaining)

        // Show modal when warning threshold is reached
        if (remaining <= warningTimeMs && !showModal) {
          console.log('Session expiring soon - showing modal. Remaining:', Math.floor(remaining / 1000), 'seconds')
          setShowModal(true)
        }

        // Auto-logout when time hits zero
        if (remaining <= 1000 && !sessionExpired) {
          console.log('Session time reached zero - auto logout')
          forceLogout()
          return
        }

      } catch (error) {
        console.error('Session check error:', error)
        forceLogout()
      }
    }

    // Check immediately
    checkSession()

    // Check every 2 seconds for more responsive UI (especially important for short sessions)
    intervalRef.current = setInterval(checkSession, 2000)
  }, [warningTimeMs, showModal, sessionExpired, forceLogout, sessionTimeoutHours, sessionTimeoutMs])

  // EXTEND SESSION - Actually refresh the token
  const extendSession = useCallback(async () => {
    if (isExtending || sessionExpired) return

    setIsExtending(true)

    try {
      // Call refresh endpoint to get new token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        await response.json() // Consume response

        // Hide modal and restart monitoring
        setShowModal(false)
        setIsExtending(false)

        // Restart session monitoring with new expiry
        setTimeout(() => {
          startSessionMonitoring()
        }, 100) // Small delay to ensure state is updated

        console.log('Session extended successfully')
      } else {
        console.error('Session extension failed:', response.status)
        forceLogout()
      }
    } catch (error) {
      console.error('Session extend error:', error)
      forceLogout()
    }
  }, [isExtending, sessionExpired, forceLogout, startSessionMonitoring])

  // Format time display
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Start monitoring on mount
  useEffect(() => {
    console.log('SessionTimeout component mounted with timeout:', sessionTimeoutHours, 'hours')
    console.log('Warning threshold:', warningTimeMs / 1000, 'seconds')
    startSessionMonitoring()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [startSessionMonitoring, sessionTimeoutHours, warningTimeMs])

  // Don't render if no modal needed
  if (!showModal || sessionExpired) {
    return null
  }

  // LOCKED MODAL - No escape, no flicker, no mercy
  return (
    <>
      {/* FULL SCREEN OVERLAY - BLOCKS EVERYTHING */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border-2 border-red-500">
          {/* HEADER - Critical Warning */}
          <div className="bg-red-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-white" />
              <h2 className="font-bold text-white text-lg">🚨 SESSION EXPIRING</h2>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Your session will expire in <strong>{formatTime(timeLeft)}</strong>
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-bold text-2xl text-yellow-800">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                You will be automatically logged out when this timer reaches zero.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex space-x-3">
              <Button
                onClick={extendSession}
                disabled={isExtending || sessionExpired}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {isExtending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Extending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Extend Session
                  </>
                )}
              </Button>

              <Button
                onClick={forceLogout}
                disabled={isLoggingOut}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isLoggingOut ? (
                  <>
                    <LogOut className="h-4 w-4 mr-2 animate-pulse" />
                    Logging Out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout Now
                  </>
                )}
              </Button>
            </div>

            {/* WARNING TEXT */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                This display cannot be closed. You must choose an action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
