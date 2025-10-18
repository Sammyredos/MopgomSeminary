'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { LoginLogo } from '@/components/ui/UniversalLogo'
import { useReactiveSystemName } from '@/components/ui/reactive-system-name'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [countdown, setCountdown] = useState(5)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const systemName = useReactiveSystemName()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Start countdown timer
        let timeLeft = 5
        setCountdown(timeLeft)
        
        const timer = setInterval(() => {
          timeLeft -= 1
          setCountdown(timeLeft)
          
          if (timeLeft <= 0) {
            clearInterval(timer)
            router.push('/login')
          }
        }, 1000)
        
        // Cleanup timer if component unmounts
        return () => clearInterval(timer)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#f1f1f1'}}>
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <h3 className="font-apercu-medium text-lg text-gray-900 mb-2">
                  Invalid Reset Link
                </h3>
                <p className="font-apercu-regular text-gray-600 mb-6">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <Link href="/forgot-password">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
              Password Reset Successful
            </h1>
            <p className="font-apercu-regular text-gray-600">
              Your password has been updated
            </p>
          </div>

          <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-apercu-medium text-lg text-gray-900 mb-2">
                  Password Updated Successfully
                </h3>
                <p className="font-apercu-regular text-gray-600 mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <p className="font-apercu-regular text-sm text-gray-500 mb-6">
                  Redirecting to login page in {countdown} seconds...
                </p>
                
                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Login
                  </Button>
                </Link>
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
            Reset Password
          </h1>
          <p className="font-apercu-regular text-gray-600">
            Enter your new password
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
                <label htmlFor="password" className="font-apercu-medium text-sm text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="font-apercu-regular text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="font-apercu-medium text-sm text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-apercu-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Reset Password</span>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#f1f1f1'}}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}