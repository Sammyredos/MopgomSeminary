'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StudentLayout } from '@/components/student/StudentLayout'
import { UnderConstruction } from '@/components/ui/UnderConstruction'

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <StudentLayout title="Schedule" description="View your academic schedule and events">
        <UnderConstruction title="Schedule" />
      </StudentLayout>
    </ProtectedRoute>
  )
}