'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, User, Mail, Calendar, Loader2 } from 'lucide-react'

interface PaidConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  registration: {
    id: string
    fullName: string
    emailAddress: string
    createdAt: string
  } | null
  loading?: boolean
}

export function PaidConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  registration,
  loading = false
}: PaidConfirmModalProps) {
  const capitalizeName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 sm:p-6 border-b border-emerald-100">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h3 className="font-apercu-bold text-lg sm:text-xl text-gray-900">Mark Student as Paid</h3>
              <p className="font-apercu-regular text-sm text-gray-600">
                Grant access to course pages and student portal.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {registration && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-apercu-bold text-sm text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-600" />
                Student Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-apercu-medium text-gray-900">{capitalizeName(registration.fullName)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    Email:
                  </span>
                  <span className="font-apercu-medium text-gray-900 text-xs sm:text-sm break-all">
                    {registration.emailAddress}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Registered:
                  </span>
                  <span className="font-apercu-medium text-gray-900 text-xs sm:text-sm">
                    {formatDate(registration.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="font-apercu-regular text-sm text-emerald-700">
              Marking as paid will immediately enable the student's access to course pages.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 font-apercu-medium">
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-apercu-medium text-white">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Paid
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}