'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SecurePdfViewer from '@/components/student/SecurePdfViewer'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

export default function SecureContentViewerClient() {
  const params = useSearchParams()
  const router = useRouter()
  const { currentUser } = useUser()

  const url = params.get('url') ? decodeURIComponent(params.get('url') as string) : ''
  const title = params.get('title') ? decodeURIComponent(params.get('title') as string) : 'Secure Document'
  const subject = params.get('subject') ? decodeURIComponent(params.get('subject') as string) : 'General'
  const description = params.get('description') ? decodeURIComponent(params.get('description') as string) : ''
  // Removed watermark for PDF viewer per user request

  return (
    <div className="px-6 py-6 space-y-4">
      <Button
        onClick={() => router.back()}
        className="mb-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
        aria-label="Back to course page"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to course page
      </Button>

      {!url ? (
        <div className="text-sm text-red-600">Invalid document URL.</div>
      ) : (
        <div
          className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4 sm:p-5"
          onContextMenu={(e) => e.preventDefault()}
        >
          <SecurePdfViewer fileUrl={url} title={title} subjectLabel={subject} description={description} />
        </div>
      )}
    </div>
  )
}