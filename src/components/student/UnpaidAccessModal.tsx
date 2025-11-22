'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Phone } from 'lucide-react'

interface UnpaidAccessModalProps {
  open: boolean
}

export function UnpaidAccessModal({ open }: UnpaidAccessModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 xl:left-64 z-[100] bg-black/60 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 p-6 bg-white">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-gray-900 font-apercu-bold text-lg">Payment Required</div>
        </div>
        <p className="font-apercu-regular text-sm text-gray-700 mb-4">You have not paid for course access. Please call +2347033468478.</p>
        <div className="flex justify-end">
          <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
            <a href="tel:+2347033468478"><Phone className="h-4 w-4 mr-2" />Call +2347033468478</a>
          </Button>
        </div>
      </Card>
    </div>
  )
}