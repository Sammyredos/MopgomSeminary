'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  CheckCircle, 
  Mail, 
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegistrationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  studentName?: string
  studentEmail?: string
  onContinue?: () => void
}

export function RegistrationSuccessModal({
  isOpen,
  onClose,
  studentName = 'Student',
  studentEmail = '',
  onContinue
}: RegistrationSuccessModalProps) {
  
  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      window.location.href = '/login'
    }
  }

  const handleGoHome = () => {
    onClose()
    // Redirect to home page
    setTimeout(() => {
      window.location.href = '/'
    }, 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <Card className="w-full shadow-2xl border-0 bg-white">
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-8 text-white text-center">
            {/* Success icon */}
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-white text-center">
                🎉 Registration Successful!
              </DialogTitle>
              <p className="text-white/90 text-lg font-medium">
                Welcome to MOPGOM Theological Seminary
              </p>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Welcome message */}
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">
                Welcome, {studentName}! 📖
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your account has been created successfully. Your journey in faith and learning begins here!
              </p>
            </div>

            {/* Email notification card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 text-sm">
                    📧 Check Your Email
                  </h4>
                  <p className="text-blue-700 text-xs">
                    Welcome email sent to <strong>{studentEmail}</strong>. Check your inbox for next steps.
                  </p>
                </div>
              </div>
            </div>



            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleContinue}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-colors"
              >
                Go Home
              </Button>
            </div>

            {/* Footer note */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Need help? Contact us at{' '}
                <a href="mailto:support@mopgom.edu" className="text-blue-600 hover:underline">
                  support@mopgom.edu
                </a>
              </p>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default RegistrationSuccessModal