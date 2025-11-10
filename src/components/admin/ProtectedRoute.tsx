'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackPath = '/admin/dashboard'
}: ProtectedRouteProps) {
  const { currentUser, loading } = useUser()
  const router = useRouter()
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'redirecting'>('loading')

  useEffect(() => {
    if (loading) {
      setAuthState('loading')
      return
    }

    if (!currentUser) {
      setAuthState('redirecting')
      router.push('/admin/login')
      return
    }

    // Check role-based access
    const hasRequiredRole = requiredRoles.length === 0 ||
      requiredRoles.includes(currentUser.role?.name || '')

    // Check permission-based access
    const hasRequiredPermission = requiredPermissions.length === 0 ||
      requiredPermissions.some(permission => {
        // Super Admin and Admin have all permissions
        if (currentUser.role?.name === 'Super Admin' || currentUser.role?.name === 'Admin') {
          return true
        }

        return currentUser.role?.permissions?.some(p =>
          p.name === permission || p.name === 'system:admin'
        )
      })

    if (hasRequiredRole && hasRequiredPermission) {
      setAuthState('authorized')
    } else {
      setAuthState('redirecting')
      router.push(fallbackPath)
    }
  }, [currentUser, loading, router, requiredRoles, requiredPermissions, fallbackPath])

  // Avoid any UI flash during loading or redirect
  if (authState === 'loading' || authState === 'redirecting') {
    return null
  }

  return <>{children}</>
}
