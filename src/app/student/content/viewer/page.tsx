import React, { Suspense } from 'react'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StudentLayout } from '@/components/student/StudentLayout'
import SecureContentViewerClient from '@/components/student/SecureContentViewerClient'

export default function StudentSecureContentViewerPage() {
  return (
    <ProtectedRoute>
      <StudentLayout title="Secure Document" description="Secure, read-only viewer">
        <Suspense fallback={<div className="px-6 py-6">Loading viewer…</div>}>
          <SecureContentViewerClient />
        </Suspense>
      </StudentLayout>
    </ProtectedRoute>
  )
}

export const dynamic = 'force-dynamic'