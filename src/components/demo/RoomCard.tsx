'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BedDouble, Users, Wifi, ShowerHead, DoorOpen, Sparkles, MapPin, ShieldCheck } from 'lucide-react'

export interface RoomCardProps {
  id: string
  name: string
  building?: string
  capacity: number
  occupied: number
  amenities?: string[]
  status?: 'available' | 'full' | 'maintenance'
  pricePerNight?: number
  onReserve?: (id: string) => void
}

/**
 * RoomCard (Demo)
 * Replicates a modern accommodation "room card" UI:
 * - icon header
 * - name, capacity, status line
 * - amenities badges
 * - reserve CTA
 * Pure presentational component with responsive styles.
 */
export function RoomCard({
  id,
  name,
  building,
  capacity,
  occupied,
  amenities = ['Wi‑Fi', 'Shower', 'Closet'],
  status = 'available',
  pricePerNight,
  onReserve,
}: RoomCardProps) {
  const remaining = Math.max(capacity - occupied, 0)
  const statusStyle = status === 'available'
    ? 'bg-green-100 text-green-800 border-green-200'
    : status === 'full'
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-amber-100 text-amber-800 border-amber-200'

  return (
    <Card className="bg-white border-2 border-[#efefef] shadow-sm rounded-2xl overflow-hidden h-full">
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white grid place-items-center flex-shrink-0">
            <BedDouble className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-apercu-bold text-gray-900 truncate" title={name}>{name}</h3>
              {building && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />{building}
                </Badge>
              )}
              <Badge className={statusStyle + ' text-xs'}>
                {status === 'available' ? 'Available' : status === 'full' ? 'Full' : 'Maintenance'}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-gray-700 flex items-center gap-3">
              <span className="inline-flex items-center"><Users className="h-4 w-4 mr-1 text-indigo-600" />{occupied}/{capacity} occupied</span>
              <span className="inline-flex items-center"><DoorOpen className="h-4 w-4 mr-1 text-green-600" />{remaining} spaces left</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {amenities.map((a, idx) => (
            <Badge key={idx} className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
              {a === 'Wi‑Fi' ? <Wifi className="h-3 w-3 mr-1" /> : a === 'Shower' ? <ShowerHead className="h-3 w-3 mr-1" /> : a === 'Closet' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
              {a}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {typeof pricePerNight === 'number' ? (
              <span className="font-apercu-bold">₦{pricePerNight.toLocaleString()}</span>
            ) : (
              <span className="text-gray-500">Contact admin for rates</span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => onReserve?.(id)} disabled={status !== 'available'}>
            Reserve
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}