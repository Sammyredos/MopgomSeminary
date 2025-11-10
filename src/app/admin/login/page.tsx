'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
// import { useRouter } from 'next/navigation' // Commented out as unused
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, Mail, Users, Shield, ArrowRight, Loader2 } from 'lucide-react'
// import { HydrationSafeDiv } from '@/components/ui/hydration-safe' // Commented out as unused

import { useProgress } from '@/hooks/useProgress'
import { LoginLogo } from '@/components/ui/UniversalLogo'
import { useReactiveSystemName } from '@/components/ui/reactive-system-name'
import { pagePreloader } from '@/lib/page-preloader'
import { LockoutCountdown, parseLockoutTime } from '@/components/ui/LockoutCountdown'
import '@/styles/login-animations.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)

  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null)
  const { startProgress, completeProgress } = useProgress()
  const systemName = useReactiveSystemName()
  // Removed router as it's not used (using window.location.replace instead)

  // Redirect if already authenticated as admin (must be inside component)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data?.user?.type === 'admin') {
            window.location.replace('/admin/dashboard')
            return
          }
        }
      } catch {}
      setAuthChecking(false)
    }
    checkAuth()
  }, [])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    startProgress()

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Set success state and keep loading active
        setLoginSuccess(true)
        
        // Start preloading in background before redirect
        Promise.all([
          pagePreloader.preloadAllPages(),
          pagePreloader.preloadCriticalAPIs()
        ]).catch(console.warn)
        
        // Redirect after showing success state
        setTimeout(() => {
          window.location.replace('/admin/dashboard')
        }, 1000)
      } else {
        // Check if this is a lockout error (status 423) or rate limit error (status 429)
        if ((response.status === 423 && data.lockoutTime) || (response.status === 429 && data.rateLimitExceeded)) {
          let lockoutTime: Date | null = null
          
          if (response.status === 423 && data.lockoutTime) {
            // Account lockout from failed attempts
            lockoutTime = parseLockoutTime(data.error, data.lockoutTime)
          } else if (response.status === 429 && data.resetTime) {
            // Rate limit exceeded - use resetTime for countdown
            lockoutTime = new Date(data.resetTime)
          }
          
          if (lockoutTime) {
            setLockoutEndTime(lockoutTime)
            setError('') // Clear regular error since we'll show countdown
          } else {
            setError(data.error || 'Account temporarily locked')
          }
        } else {
          setError(data.error || 'Login failed')
          setLockoutEndTime(null) // Clear any existing lockout
        }
        
        setLoading(false)
        completeProgress()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
      setLoading(false)
      completeProgress()
    }
    // Note: Don't set loading to false in finally block for successful logins
  }



  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-4" suppressHydrationWarning={true}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" suppressHydrationWarning={true} />

      {/* Main Container */}
      {authChecking ? (
        <div className="w-full max-w-md animate-fade-in" suppressHydrationWarning={true}>
          <Card className="shadow-xl border-2 border-[#efefef] bg-white backdrop-blur-sm">
            <CardContent className="py-12 px-8">
              <div className="text-center">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  <div className="space-y-2">
                    <h2 className="font-apercu-bold text-xl text-gray-800">Authenticating</h2>
                    <p className="font-apercu-medium text-gray-600">Checking your session...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
      <div className="w-full max-w-md animate-fade-in" suppressHydrationWarning={true}>
        {/* Header Section */}
        <div className="text-center mb-8 animate-slide-in-up" suppressHydrationWarning={true}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg animate-float overflow-hidden">
            <LoginLogo
              className="w-16 h-16 rounded-2xl"
              alt="System Logo"
              fallbackText="M"
            />
          </div>
          <h1 className="font-apercu-bold text-3xl text-gray-900 mb-2 animate-fade-in animate-delay-100">
            Administrator Access
          </h1>
          <p className="font-apercu-regular text-gray-600 animate-fade-in animate-delay-200">
            Sign in to your dashboard
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 animate-fade-in animate-delay-300">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="font-apercu-medium text-sm text-indigo-600">{systemName}</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
         

          <CardContent className="space-y-6">
            {lockoutEndTime && (
              <LockoutCountdown 
                lockoutEndTime={lockoutEndTime}
                onCountdownComplete={() => {
                  setLockoutEndTime(null)
                  setError('')
                }}
              />
            )}
            
            {error && !lockoutEndTime && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="font-apercu-medium text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
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
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-apercu-regular pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="font-apercu-medium text-sm text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
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
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !!lockoutEndTime}
                className={`w-full h-12 font-apercu-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  loginSuccess 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                } text-white`}
              >
                {loginSuccess ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span className="text-white">Login Successful! Redirecting...</span>
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-white">Signing in...</span>
                  </div>
                ) : (
                  <div className="flex text-white items-center gap-2">
                    <span className="text-white">Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>



          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="font-apercu-regular text-sm text-gray-500">
            Secure Access to <span className="font-apercu-regular text-sm text-gray-500">{systemName}</span> Management System
          </p>
        </div>
      </div>
      )}
    </div>
  )
}
