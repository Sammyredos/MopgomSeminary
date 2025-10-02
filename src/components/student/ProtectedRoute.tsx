'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

interface ProtectedRouteProps {
  children: ReactNode
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { currentUser, loading } = useUser()
  const router = useRouter()
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'unauthorized'>('loading')

  useEffect(() => {
    if (loading) {
      setAuthState('loading')
      return
    }

    if (!currentUser) {
      setAuthState('unauthorized')
      router.push(fallbackPath)
      return
    }

    // Check if user has student role
    const isStudent = currentUser.role?.name === 'Student'

    if (isStudent) {
      setAuthState('authorized')
    } else {
      setAuthState('unauthorized')
      router.push(fallbackPath)
    }
  }, [currentUser, loading, router, fallbackPath])

  // Only show loading spinner during initial auth check
  if (authState === 'loading') {
    return null // Let the parent component handle loading state
  }

  // Don't render anything if unauthorized (redirect is happening)
  if (authState === 'unauthorized') {
    return null
  }

  // Only render children when fully authorized
  return <>{children}</>
}