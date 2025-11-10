import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingIndicatorProps {
  label?: string
  className?: string
  iconClassName?: string
}

export function LoadingIndicator({ label = 'Processing...', className, iconClassName }: LoadingIndicatorProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className || ''}`}>
      <Loader2 className={`h-4 w-4 animate-spin ${iconClassName || ''}`} />
      <span>{label}</span>
    </span>
  )
}

export default LoadingIndicator