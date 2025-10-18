/**
 * Centralized statistics service to ensure consistent data across all pages
 * This prevents discrepancies between dashboard, accommodations, and other pages
 */

export interface SystemStatistics {
  registrations: {
    total: number
    allocated: number
    unallocated: number
    allocationRate: number
    byGender: {
      male: number
      female: number
    }
    recent: {
      today: number
      thisWeek: number
      thisMonth: number
    }
    permissions: {
      granted: number
      pending: number
    }
  }
  rooms: {
    total: number
    active: number
    byGender: {
      male: number
      female: number
    }
    capacity: {
      total: number
      occupied: number
      available: number
      utilizationRate: number
    }
  }
  allocations: {
    total: number
    byGender: {
      male: number
      female: number
    }
  }
}

/**
 * Fetch comprehensive system statistics
 * This function ensures all pages get the same accurate data
 */
export async function fetchSystemStatistics(): Promise<SystemStatistics> {
  try {
    const res = await fetch('/api/admin/statistics')
    if (!res.ok) throw new Error('Failed to fetch admin statistics')
    const payload = await res.json()
    const stats = payload.statistics || payload

    const systemStats: SystemStatistics = {
      registrations: {
        total: stats?.registrations?.total || 0,
        allocated: stats?.registrations?.allocated || 0,
        unallocated: stats?.registrations?.unallocated ?? Math.max((stats?.registrations?.total || 0) - (stats?.registrations?.allocated || 0), 0),
        allocationRate: stats?.registrations?.allocationRate ?? (stats?.registrations?.total ? Math.round(((stats?.registrations?.allocated || 0) / stats?.registrations?.total) * 100) : 0),
        byGender: {
          male: stats?.registrations?.byGender?.male || 0,
          female: stats?.registrations?.byGender?.female || 0
        },
        recent: {
          today: stats?.registrations?.recent?.today || 0,
          thisWeek: stats?.registrations?.recent?.thisWeek || 0,
          thisMonth: stats?.registrations?.recent?.thisMonth || 0
        },
        permissions: {
          granted: stats?.registrations?.permissions?.granted || 0,
          pending: stats?.registrations?.permissions?.pending || 0
        }
      },
      rooms: {
        total: stats?.rooms?.total || 0,
        active: (stats?.rooms?.active ?? stats?.rooms?.total ?? 0),
        byGender: {
          male: stats?.rooms?.byGender?.male || 0,
          female: stats?.rooms?.byGender?.female || 0
        },
        capacity: {
          total: stats?.rooms?.capacity?.total || 0,
          occupied: stats?.rooms?.capacity?.occupied || 0,
          available: stats?.rooms?.capacity?.available || 0,
          utilizationRate: stats?.rooms?.capacity?.utilizationRate ?? 0
        }
      },
      allocations: {
        total: (stats?.allocations?.total ?? stats?.rooms?.capacity?.occupied ?? 0),
        byGender: {
          male: stats?.allocations?.byGender?.male || 0,
          female: stats?.allocations?.byGender?.female || 0
        }
      }
    }

    return systemStats
  } catch (error) {
    console.error('Error fetching system statistics:', error)
    return {
      registrations: {
        total: 0,
        allocated: 0,
        unallocated: 0,
        allocationRate: 0,
        byGender: { male: 0, female: 0 },
        recent: { today: 0, thisWeek: 0, thisMonth: 0 },
        permissions: { granted: 0, pending: 0 }
      },
      rooms: {
        total: 0,
        active: 0,
        byGender: { male: 0, female: 0 },
        capacity: { total: 0, occupied: 0, available: 0, utilizationRate: 0 }
      },
      allocations: {
        total: 0,
        byGender: { male: 0, female: 0 }
      }
    }
  }
}

/**
 * Format numbers for display with proper locale formatting
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Format percentage for display
 */
export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`
}

/**
 * Calculate allocation rate
 */
export function calculateAllocationRate(allocated: number, total: number): number {
  return total > 0 ? Math.round((allocated / total) * 100) : 0
}

/**
 * Get status color based on allocation rate
 */
export function getStatusColor(rate: number): string {
  if (rate >= 90) return 'text-green-600'
  if (rate >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get status text based on allocation rate
 */
export function getStatusText(rate: number): string {
  if (rate >= 90) return 'Excellent'
  if (rate >= 70) return 'Good'
  if (rate >= 50) return 'Fair'
  return 'Needs Attention'
}

/**
 * Validate statistics for consistency
 */
export function validateStatistics(stats: SystemStatistics): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  
  // Check if allocated + unallocated = total
  const totalCheck = stats.registrations.allocated + stats.registrations.unallocated
  if (totalCheck !== stats.registrations.total && stats.registrations.total > 0) {
    warnings.push(`Registration totals don't match: ${totalCheck} vs ${stats.registrations.total}`)
  }
  
  // Check if allocation count matches
  if (stats.allocations.total !== stats.registrations.allocated) {
    warnings.push(`Allocation counts don't match: ${stats.allocations.total} vs ${stats.registrations.allocated}`)
  }
  
  // Check capacity utilization
  if (stats.rooms.capacity.occupied > stats.rooms.capacity.total) {
    warnings.push(`Occupied spaces exceed total capacity`)
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  }
}

/**
 * Cache for statistics to prevent excessive API calls
 */
let statisticsCache: {
  data: SystemStatistics | null
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

/**
 * Get cached statistics or fetch fresh data
 */
export async function getCachedStatistics(): Promise<SystemStatistics> {
  const now = Date.now()
  
  // Return cached data if it's still fresh
  if (statisticsCache.data && (now - statisticsCache.timestamp) < CACHE_DURATION) {
    return statisticsCache.data
  }
  
  // Fetch fresh data
  const stats = await fetchSystemStatistics()
  
  // Update cache
  statisticsCache = {
    data: stats,
    timestamp: now
  }
  
  return stats
}

/**
 * Clear statistics cache (useful after data changes)
 */
export function clearStatisticsCache(): void {
  statisticsCache = {
    data: null,
    timestamp: 0
  }
}
