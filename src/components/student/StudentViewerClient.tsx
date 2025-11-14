"use client"

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StudentLayout } from '@/components/student/StudentLayout'
import SecurePdfViewer from '@/components/student/SecurePdfViewer'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

export default function StudentViewerClient() {
  const params = useSearchParams()
  const router = useRouter()
  const { currentUser } = useUser()

  const url = params.get('url') ? decodeURIComponent(params.get('url') as string) : ''
  const title = params.get('title') ? decodeURIComponent(params.get('title') as string) : 'Secure Document'

  const watermarkText = currentUser ? `${currentUser.name || 'Student'} • ${currentUser.email || ''}` : 'Authorized Student'

  return (
    <StudentLayout title={title} description="Secure, read-only viewer">
      <div className="px-6 py-6 space-y-4">
        <Button variant="outline" onClick={() => router.back()} className="mb-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {!url ? (
          <div className="text-sm text-red-600">Invalid document URL.</div>
        ) : (
          <div
            className="rounded-lg border bg-white p-4"
            onContextMenu={(e) => e.preventDefault()}
          >
            <SecurePdfViewer fileUrl={url} watermarkText={watermarkText} />
          </div>
        )}
      </div>
    </StudentLayout>
  )
}