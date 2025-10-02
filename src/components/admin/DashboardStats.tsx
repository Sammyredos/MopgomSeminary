/**
 * Simple dashboard stats component - no heavy animations for better performance
 */

import React from 'react'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react'

interface DashboardStatsProps {
  stats?: {
    totalRegistrations: number
    verifiedRegistrations: number
    unverifiedRegistrations: number
    recentActivity: number
    allocationRate?: number
    systemHealth?: number
  }
  loading?: boolean
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  // Calculate allocation rate if verified registrations exist
  const allocationRate = stats?.allocationRate || 
    (stats?.verifiedRegistrations ? Math.round((stats.verifiedRegistrations / Math.max(stats.totalRegistrations, 1)) * 100) : 0)
  
  // Calculate system health score (simplified metric)
  const systemHealth = stats?.systemHealth || 
    (stats?.totalRegistrations ? Math.min(100, Math.round(85 + (stats.recentActivity / 10))) : 85)

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
      />

      <StatsCard
        title="Verified"
        value={stats?.verifiedRegistrations || 0}
        subtitle="Attendance confirmed"
        icon={UserCheck}
        gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        bgGradient="bg-gradient-to-br from-white to-green-50"
        loading={loading}
      />

      <StatsCard
        title="Recent Activity"
        value={stats?.recentActivity || 0}
        subtitle="Today's registrations"
        icon={Activity}
        gradient="bg-gradient-to-r from-orange-500 to-amber-600"
        bgGradient="bg-gradient-to-br from-white to-orange-50"
        loading={loading}
      />

      <StatsCard
        title="Verification Rate"
        value={`${allocationRate}%`}
        subtitle="Completion progress"
        icon={TrendingUp}
        gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
        bgGradient="bg-gradient-to-br from-white to-purple-50"
        loading={loading}
      />
    </StatsGrid>
  )
}
