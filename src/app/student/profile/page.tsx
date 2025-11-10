'use client'

import React from 'react'
import { StudentLayout } from '@/components/student/StudentLayout'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import ProfileContent from '@/app/student/profile/ProfileContent'

export default function StudentProfilePage() {
  return (
    <ProtectedRoute>
      <StudentLayout title="Profile" description="View and update your personal information">
        <div className="min-h-screen">
          <ProfileContent />
        </div>
      </StudentLayout>
    </ProtectedRoute>
  )
}