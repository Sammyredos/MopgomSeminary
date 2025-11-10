'use client'

import React from 'react'
import { ToastProvider } from '@/contexts/ToastContext'

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}