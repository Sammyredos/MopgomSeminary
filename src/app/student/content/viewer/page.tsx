import React, { Suspense } from 'react'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StudentLayout } from '@/components/student/StudentLayout'
import SecureContentViewerClient from '@/components/student/SecureContentViewerClient'

export default function StudentSecureContentViewerPage() {
  return (
    <ProtectedRoute>
      <StudentLayout title="Secure Document" contentPaddingClass="px-0">
        <Suspense fallback={<div className="py-6">Loading viewer…</div>}>
          <SecureContentViewerClient />
        </Suspense>
      </StudentLayout>
    </ProtectedRoute>
  )
}

export const dynamic = 'force-dynamic'