'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { LoginLogo } from '@/components/ui/UniversalLogo'
import { useReactiveSystemName } from '@/components/ui/reactive-system-name'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const systemName = useReactiveSystemName()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#f1f1f1'}}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg overflow-hidden">
              <LoginLogo
                className="w-16 h-16 rounded-2xl"
                alt="System Logo"
                fallbackText="M"
              />
            </div>
            <h1 className="font-apercu-bold text-3xl text-gray-900 mb-2">
              Check Your Email
            </h1>
            <p className="font-apercu-regular text-gray-600">
              Password reset instructions sent
            </p>
          </div>

          <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-apercu-medium text-lg text-gray-900 mb-2">
                  Email Sent Successfully
                </h3>
                <p className="font-apercu-regular text-gray-600 mb-4">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <p className="font-apercu-regular text-sm text-gray-500 mb-6">
                  Please check your email and follow the instructions to reset your password. 
                  The link will expire in 1 hour for security reasons.
                </p>
                
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="w-full"
                  >
                    Send Another Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#f1f1f1'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg overflow-hidden">
            <LoginLogo
              className="w-16 h-16 rounded-2xl"
              alt="System Logo"
              fallbackText="M"
            />
          </div>
          <h1 className="font-apercu-bold text-3xl text-gray-900 mb-2">
            Forgot Password
          </h1>
          <p className="font-apercu-regular text-gray-600">
            Enter your email to reset your password
          </p>
        </div>

        <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="font-apercu-medium text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="font-apercu-medium text-sm text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-apercu-regular pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-apercu-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="text-white">Sending Reset Email...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="text-white w-4 h-4" />
                    <span className="text-white">Send Reset Email</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-100">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-apercu-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="font-apercu-regular text-sm text-gray-500">
            Secure Access to <span className="font-apercu-regular text-sm text-gray-500">{systemName}</span> Management System
          </p>
        </div>
      </div>
    </div>
  )
}