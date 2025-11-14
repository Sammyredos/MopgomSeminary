'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StudentLayout } from '@/components/student/StudentLayout'
import { UnderConstruction } from '@/components/ui/UnderConstruction'

export default function AssignmentsPage() {
  return (
    <ProtectedRoute>
      <StudentLayout title="Assignments" description="View and submit your course assignments">
        <UnderConstruction title="Assignments" />
      </StudentLayout>
    </ProtectedRoute>
  )
}