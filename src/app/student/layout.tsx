'use client'

import { ReactNode } from 'react'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MessageProvider } from '@/contexts/MessageContext'
import { UserProvider } from '@/contexts/UserContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { BrandingProvider } from '@/contexts/BrandingContext'
import { PerformanceInitializer } from '@/components/performance/PerformanceInitializer'

interface StudentLayoutProps {
  children: ReactNode
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <BrandingProvider>
      <UserProvider>
        <NotificationProvider>
          <MessageProvider>
            <ToastProvider>
              <PerformanceInitializer enablePreloading={true} enableMonitoring={true} />
              {children}
            </ToastProvider>
          </MessageProvider>
        </NotificationProvider>
      </UserProvider>
    </BrandingProvider>
  )
}