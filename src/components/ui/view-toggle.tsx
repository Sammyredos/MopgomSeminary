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
    <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        onClick={() => onViewChange('grid')}
        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 ${viewMode === 'grid' ? 'text-white' : 'text-black'}`}
        size="sm"
        aria-label="Grid view"
        title="Grid view"
      >
        <LayoutGrid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-white' : 'text-black'}`} />
        <span className={`hidden sm:inline ${viewMode === 'grid' ? 'text-white' : 'text-black'}`}>Grid View</span>
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        onClick={() => onViewChange('list')}
        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 ${viewMode === 'list' ? 'text-white' : 'text-black'}`}
        size="sm"
        aria-label="List view"
        title="List view"
      >
        <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-white' : 'text-black'}`} />
        <span className={`hidden sm:inline ${viewMode === 'list' ? 'text-white' : 'text-black'}`}>List View</span>
      </Button>
    </div>
  )
}