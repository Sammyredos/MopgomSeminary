import React, { Suspense } from 'react'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import StudentViewerClient from '@/components/student/StudentViewerClient'

export default function StudentSecureContentViewerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading viewer…</div>}>
      <ProtectedRoute>
        <StudentViewerClient />
      </ProtectedRoute>
    </Suspense>
  )
}