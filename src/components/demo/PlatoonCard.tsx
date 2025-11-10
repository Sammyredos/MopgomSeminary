'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, UserCircle2, Flag, CalendarDays, ShieldCheck, Activity, Layers } from 'lucide-react'

export interface PlatoonCardProps {
  id: string
  name: string
  leader?: string
  capacity: number
  members: number
  program?: string
  status?: 'active' | 'inactive' | 'training'
  nextActivity?: string
  onView?: (id: string) => void
}

/**
 * PlatoonCard (Demo)
 * Replicates a squad/platoon overview card UI:
 * - gradient header with icon
 * - name, program, status, leader
 * - compact stats and CTA
 */
export function PlatoonCard({
  id,
  name,
  leader,
  capacity,
  members,
  program,
  status = 'active',
  nextActivity,
  onView,
}: PlatoonCardProps) {
  const remaining = Math.max(capacity - members, 0)
  const statusStyle = status === 'active'
    ? 'bg-green-100 text-green-800 border-green-200'
    : status === 'training'
    ? 'bg-sky-100 text-sky-800 border-sky-200'
    : 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <Card className="bg-white border-2 border-[#efefef] shadow-sm rounded-2xl overflow-hidden h-full">
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 text-white grid place-items-center flex-shrink-0">
            <Flag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-apercu-bold text-gray-900 truncate" title={name}>{name}</h3>
              {program && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs capitalize">
                  <Layers className="h-3 w-3 mr-1" />{program}
                </Badge>
              )}
              <Badge className={statusStyle + ' text-xs capitalize'}>
                {status}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-gray-700 flex items-center gap-3">
              <span className="inline-flex items-center"><Users className="h-4 w-4 mr-1 text-emerald-600" />{members}/{capacity} members</span>
              <span className="inline-flex items-center"><ShieldCheck className="h-4 w-4 mr-1 text-green-600" />{remaining} slots open</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {leader && (
            <Badge variant="outline" className="text-xs">
              <UserCircle2 className="h-3 w-3 mr-1" />Leader: {leader}
            </Badge>
          )}
          {nextActivity && (
            <Badge variant="outline" className="text-xs">
              <CalendarDays className="h-3 w-3 mr-1" />Next: {nextActivity}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />Readiness: {status === 'active' ? 'High' : status === 'training' ? 'Medium' : 'Low'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="text-gray-500">Platoon overview</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => onView?.(id)}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}