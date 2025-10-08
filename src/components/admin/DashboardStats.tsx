/**
 * Simple dashboard stats component - no heavy animations for better performance
 */

import React from 'react'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import {
  Users,
  UserCog,
  BookOpen,
  MessageSquare
} from 'lucide-react'

interface DashboardStatsProps {
  stats?: {
    totalRegistrations?: number
    instructorsCount?: number
    coursesCount?: number
    messagesCount?: number
  }
  loading?: boolean
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  return (
    <StatsGrid columns={4}>
      <StatsCard
        title="Total Registrations"
        value={stats?.totalRegistrations || 0}
        subtitle="All participants"
        icon={Users}
        gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
        bgGradient="bg-gradient-to-br from-white to-blue-50"
        loading={loading}
        href="/admin/registrations"
        ariaLabel="Go to registrations"
      />

      <StatsCard
        title="Instructors"
        value={stats?.instructorsCount || 0}
        subtitle="Active instructors"
        icon={UserCog}
        gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        bgGradient="bg-gradient-to-br from-white to-green-50"
        loading={loading}
        href="/admin/teachers"
        ariaLabel="Go to teachers"
      />

      <StatsCard
        title="Total Subject Courses"
        value={stats?.coursesCount || 0}
        subtitle="Active courses"
        icon={BookOpen}
        gradient="bg-gradient-to-r from-orange-500 to-amber-600"
        bgGradient="bg-gradient-to-br from-white to-orange-50"
        loading={loading}
        href="/admin/courses"
        ariaLabel="Go to courses"
      />

      <StatsCard
        title="Messages"
        value={stats?.messagesCount || 0}
        subtitle="Total messages"
        icon={MessageSquare}
        gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
        bgGradient="bg-gradient-to-br from-white to-purple-50"
        loading={loading}
        href="/admin/inbox"
        ariaLabel="Go to inbox"
      />
    </StatsGrid>
  )
}
