'use client'

import { Button } from '@/components/ui/button'
import { Grid3X3, List, LayoutGrid } from 'lucide-react'

interface ViewToggleProps {
  viewMode: 'grid' | 'list'
  onViewChange: (mode: 'grid' | 'list') => void
  className?: string
}

export function ViewToggle({ viewMode, onViewChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        onClick={() => onViewChange('grid')}
        className="px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        size="sm"
      >
        <LayoutGrid className="h-4 w-4" />
        Grid View
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        onClick={() => onViewChange('list')}
        className="px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        size="sm"
      >
        <List className="h-4 w-4" />
        List View
      </Button>
    </div>
  )
}