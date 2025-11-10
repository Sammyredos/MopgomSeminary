'use client'

import { Loader2 } from 'lucide-react'

interface ModalLoadingProps {
  message?: string
}

export function ModalLoading({ message = 'Loading...' }: ModalLoadingProps) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex items-center gap-3 text-gray-700">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="font-apercu-medium">{message}</span>
      </div>
    </div>
  )
}

export default ModalLoading