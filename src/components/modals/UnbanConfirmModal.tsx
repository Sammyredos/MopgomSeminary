'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserCheck, User, Mail, Calendar, Loader2, CheckCircle } from 'lucide-react'

interface UnbanConfirmModalProps {
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

export function UnbanConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  registration,
  loading = false
}: UnbanConfirmModalProps) {
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
        {/* Header */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 border-b border-green-100">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h3 className="font-apercu-bold text-lg sm:text-xl text-gray-900">Reactivate Student</h3>
              <p className="font-apercu-regular text-sm text-gray-600">
                Allow this student to log in and access the portal again.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Participant Info */}
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

          {/* Information */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-apercu-bold text-sm text-emerald-700">Reactivation</h4>
                <p className="font-apercu-regular text-sm text-emerald-700 mt-1">
                  Reactivating will immediately enable the student's account. They will be able to log in and access the portal.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 font-apercu-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 font-apercu-medium text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Confirm Unban
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}