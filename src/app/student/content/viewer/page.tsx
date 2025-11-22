'use client'

import React, { Suspense } from 'react'
import { useUser } from '@/contexts/UserContext'
import { UnpaidAccessModal } from '@/components/student/UnpaidAccessModal'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StudentLayout } from '@/components/student/StudentLayout'
import SecureContentViewerClient from '@/components/student/SecureContentViewerClient'

export default function StudentSecureContentViewerPage() {
  const { currentUser, loading: userLoading } = useUser()
  const showUnpaid = !userLoading && !!currentUser && (currentUser.type === 'user' || currentUser.role?.name === 'Student') && currentUser.isActive && !currentUser.isPaid
  return (
    <ProtectedRoute>
      <StudentLayout title="Secure Document" contentPaddingClass="px-0">
        <Suspense fallback={<div className="py-6">Loading viewer…</div>}>
          <SecureContentViewerClient />
        </Suspense>
      </StudentLayout>
      <UnpaidAccessModal open={showUnpaid} />
    </ProtectedRoute>
  )
}

export const dynamic = 'force-dynamic'