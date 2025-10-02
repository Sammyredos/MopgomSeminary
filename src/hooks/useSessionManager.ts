'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SessionManagerOptions {
  timeoutMinutes?: number
  warningMinutes?: number
  onWarning?: () => void
  onTimeout?: () => void
  enabled?: boolean
}

interface SessionManagerReturn {
  timeRemaining: number
  isWarningActive: boolean
  extendSession: () => void
  logout: () => void
}

export function useSessionManager({
  timeoutMinutes,
  warningMinutes = 5,
  onWarning,
  onTimeout,
  enabled = true
}: SessionManagerOptions = {}): SessionManagerReturn {
  const router = useRouter()
  const [dynamicTimeoutMinutes, setDynamicTimeoutMinutes] = useState<number>(60) // Default fallback
  const [timeRemaining, setTimeRemaining] = useState(0) // Will be set after fetching timeout
  const [isWarningActive, setIsWarningActive] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const warningRef = useRef<NodeJS.Timeout>()
  const intervalRef = useRef<NodeJS.Timeout>()
  
  // Fetch session timeout from settings
  useEffect(() => {
    const fetchTimeout = async () => {
        try {
          const response = await fetch('/api/admin/settings/security')
        if (response.ok) {
          const data = await response.json()
          const sessionTimeoutValue = timeoutMinutes || data.settings?.sessionTimeout || 60
          setDynamicTimeoutMinutes(sessionTimeoutValue)
          setTimeRemaining(sessionTimeoutValue * 60) // Convert to seconds
        } else {
          // Use provided timeout or fallback to 60 minutes
          const fallbackTimeout = timeoutMinutes || 60
          setDynamicTimeoutMinutes(fallbackTimeout)
          setTimeRemaining(fallbackTimeout * 60)
        }
      } catch (error) {
        console.error('Failed to fetch session timeout:', error)
        // Use provided timeout or fallback to 60 minutes
        const fallbackTimeout = timeoutMinutes || 60
        setDynamicTimeoutMinutes(fallbackTimeout)
        setTimeRemaining(fallbackTimeout * 60)
      }
    }

    fetchTimeout()
  }, [timeoutMinutes])
  
  const warningThreshold = warningMinutes * 60 // in seconds
  const totalTimeout = dynamicTimeoutMinutes * 60 // in seconds

  // Reset activity timer
  const resetActivity = useCallback(() => {
    const now = Date.now()
    setLastActivity(now)
    setTimeRemaining(totalTimeout)
    setIsWarningActive(false)
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    
    if (!enabled) return

    // Set warning timer
    const warningTime = (totalTimeout - warningThreshold) * 1000
    warningRef.current = setTimeout(() => {
      setIsWarningActive(true)
      onWarning?.()
    }, warningTime)
    
    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout()
    }, totalTimeout * 1000)
  }, [totalTimeout, warningThreshold, enabled, onWarning])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      onTimeout?.()
      
      // Determine redirect based on current path
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login?logout=true'
      } else {
        window.location.href = '/login?logout=true'
      }
    } catch (error) {
      console.error('Auto-logout failed:', error)
      // Force redirect even if logout API fails
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login?logout=true'
      } else {
        window.location.href = '/login?logout=true'
      }
    }
  }, [onTimeout])

  // Extend session (reset timer)
  const extendSession = useCallback(() => {
    resetActivity()
  }, [resetActivity])

  // Activity event handlers
  const handleActivity = useCallback(() => {
    if (!enabled) return
    resetActivity()
  }, [resetActivity, enabled])

  // Update time remaining counter
  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - lastActivity) / 1000)
      const remaining = Math.max(0, totalTimeout - elapsed)
      
      setTimeRemaining(remaining)
      
      if (remaining === 0) {
        logout()
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [lastActivity, totalTimeout, enabled, logout])

  // Set up activity listeners
  useEffect(() => {
    if (!enabled) return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Throttle activity detection to avoid excessive resets
    let throttleTimeout: NodeJS.Timeout
    const throttledHandleActivity = () => {
      if (throttleTimeout) return
      throttleTimeout = setTimeout(() => {
        handleActivity()
        throttleTimeout = null as any
      }, 1000) // Throttle to once per second
    }

    events.forEach(event => {
      document.addEventListener(event, throttledHandleActivity, true)
    })

    // Initialize session
    resetActivity()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandleActivity, true)
      })
      if (throttleTimeout) clearTimeout(throttleTimeout)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, handleActivity, resetActivity])

  return {
    timeRemaining,
    isWarningActive,
    extendSession,
    logout
  }
}