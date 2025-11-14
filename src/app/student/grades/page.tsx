'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StudentLayout } from '@/components/student/StudentLayout'
import { UnderConstruction } from '@/components/ui/UnderConstruction'

export default function GradesPage() {
  return (
    <ProtectedRoute>
      <StudentLayout title="Grades" description="View your course grades and performance">
        <UnderConstruction title="Grades" />
      </StudentLayout>
    </ProtectedRoute>
  )
}