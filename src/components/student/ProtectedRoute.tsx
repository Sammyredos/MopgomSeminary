'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

interface ProtectedRouteProps {
  children: ReactNode
  fallbackPath?: string
  requirePaid?: boolean
}

export function ProtectedRoute({
  children,
  fallbackPath = '/login',
  requirePaid = false
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

    const isStudent = currentUser.type === 'user' || currentUser.role?.name === 'Student'
    const isAllowed = isStudent && currentUser.isActive && (!requirePaid || currentUser.isPaid)

    if (isAllowed) {
      setAuthState('authorized')
    } else {
      setAuthState('unauthorized')
      router.push(fallbackPath)
    }
  }, [currentUser, loading, router, fallbackPath, requirePaid])

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