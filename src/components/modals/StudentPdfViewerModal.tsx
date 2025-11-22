'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import SecurePdfViewer from '@/components/student/SecurePdfViewer'
import { Download } from 'lucide-react'

interface StudentPdfViewerModalProps {
  isOpen: boolean
  onClose: () => void
  fileUrl: string | null
  title?: string
  subjectLabel?: string | null
}

export default function StudentPdfViewerModal({ isOpen, onClose, fileUrl, title, subjectLabel }: StudentPdfViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[96vw] sm:w-auto sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] p-0 overflow-y-auto">
        <DialogHeader className="px-3 sm:px-4 pt-6 sm:pt-8 pr-12 flex justify-start">
          {fileUrl && (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white px-2">
              <a href={fileUrl} download>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </a>
            </Button>
          )}
        </DialogHeader>
        <div className="p-3 sm:p-4">
          {fileUrl ? (
            <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-2 sm:p-3 max-h-[72vh] sm:max-h-[75vh] md:max-h-[80vh] overflow-y-auto overflow-x-hidden">
              <SecurePdfViewer fileUrl={fileUrl} title={title} subjectLabel={subjectLabel || undefined} />
            </div>
          ) : (
            <div className="text-sm text-red-600">Invalid document URL.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}