'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Shield,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { LoginLogo } from '@/components/ui/UniversalLogo'
import { useProgress } from '@/hooks/useProgress'
import { useReactiveSystemName } from '@/components/ui/reactive-system-name'

import { InternationalPhoneInput } from '@/components/ui/international-phone-input'
import { ModernDatePicker } from '@/components/ui/modern-date-picker'
import { PasswordRequirements } from '@/components/ui/PasswordRequirements'
import '@/styles/login-animations.css'

interface FormData {
  surname: string
  firstname: string
  lastname: string
  email: string
  dateOfBirth: string
  gender: string
  phone: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  [key: string]: string
}

export default function StudentSignup() {
  const [formData, setFormData] = useState<FormData>({
    surname: '',
    firstname: '',
    lastname: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const { startProgress, completeProgress } = useProgress()
  const systemName = useReactiveSystemName()
  const [minimumAge, setMinimumAge] = useState(13) // Default minimum age
  const [registrationSettings, setRegistrationSettings] = useState({
    formClosureDate: '',
    minimumAge: 13,
    isFormClosed: false
  })


  // Fetch registration settings from public endpoint
  useEffect(() => {
    const fetchRegistrationSettings = async () => {
      try {
        const response = await fetch('/api/registration/settings')
        
        if (response.ok) {
          const data = await response.json()
          setRegistrationSettings({
            formClosureDate: data.formClosureDate || '',
            minimumAge: data.minimumAge || 13,
            isFormClosed: data.isFormClosed || false
          })
          setMinimumAge(data.minimumAge || 13)
        } else {
          // Keep default values if request fails
          setRegistrationSettings({
            formClosureDate: '',
            minimumAge: 13,
            isFormClosed: false
          })
        }
      } catch (error) {
        console.error('Failed to fetch registration settings:', error)
        // Keep default values
        setRegistrationSettings({
          formClosureDate: '',
          minimumAge: 13,
          isFormClosed: false
        })
      } finally {
        // Settings loaded
      }
    }

    fetchRegistrationSettings()
  }, [])

  // Countdown timer and redirect effect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      // Redirect to login page when countdown reaches 0
      window.location.href = '/login'
    }
  }, [success, countdown])

  // Age calculation function
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0
    
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Duplicate checking function
  const checkForDuplicates = async (): Promise<FormErrors> => {
    const duplicateErrors: FormErrors = {}
    
    try {
      const response = await fetch('/api/signup/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surname: formData.surname,
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          phone: formData.phone
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.isDuplicate) {
          result.duplicateFields.forEach((field: string) => {
            switch (field) {
              case 'email':
                duplicateErrors.email = 'This email address is already registered'
                break
              case 'phone':
                duplicateErrors.phone = 'This phone number is already registered'
                break
              case 'name':
                duplicateErrors.firstname = 'This name combination is already registered'
                break
              case 'similar_name':
                duplicateErrors.lastname = 'A similar name combination already exists. Please verify your information.'
                break
            }
          })
        }
      }
    } catch (error) {
      console.error('Duplicate check failed:', error)
      // Don't block submission if duplicate check fails
    }

    return duplicateErrors
  }

  const validateForm = async (): Promise<FormErrors> => {
    const newErrors: FormErrors = {}

    // Required field validation
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required'
    if (!formData.firstname.trim()) newErrors.firstname = 'First name is required'
    if (!formData.lastname.trim()) newErrors.lastname = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Date of birth validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'Please enter a valid date'
      } else {
        const age = calculateAge(formData.dateOfBirth)
        if (age < registrationSettings.minimumAge) {
          newErrors.dateOfBirth = `You must be at least ${registrationSettings.minimumAge} years old to register`
        }
      }
    }

    // Phone validation (basic format)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Password validation using admin settings
    if (formData.password) {
      try {
        const { SecurityValidator } = await import('@/lib/security')
        const validation = await SecurityValidator.validatePasswordWithSettings(formData.password)
        
        if (!validation.valid) {
          newErrors.password = validation.errors[0] // Show first error
        }
      } catch (error) {
        console.error('Password validation error:', error)
        // Fallback to basic validation if settings can't be loaded
        if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long'
        }
      }
    }

    // Password confirmation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  // Real-time duplicate checking with debounce
  const [duplicateCheckTimeout, setDuplicateCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [checkingDuplicates, setCheckingDuplicates] = useState<{[key: string]: boolean}>({})

  const checkFieldDuplicate = async (field: string, value: string) => {
    if (!value.trim()) return

    setCheckingDuplicates(prev => ({ ...prev, [field]: true }))

    try {
      const checkData: any = {}
      
      // Prepare data based on field type
      if (field === 'email') {
        checkData.email = value
      } else if (field === 'phone') {
        checkData.phone = value
      } else if (['surname', 'firstname', 'lastname'].includes(field)) {
        // For name fields, check the complete name combination
        checkData.surname = field === 'surname' ? value : formData.surname
        checkData.firstname = field === 'firstname' ? value : formData.firstname
        checkData.lastname = field === 'lastname' ? value : formData.lastname
      }

      const response = await fetch('/api/signup/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkData),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.isDuplicate) {
          const newErrors: FormErrors = {}
          
          result.duplicateFields.forEach((duplicateField: string) => {
            switch (duplicateField) {
              case 'email':
                if (field === 'email') {
                  newErrors.email = 'This email address is already registered'
                }
                break
              case 'phone':
                if (field === 'phone') {
                  newErrors.phone = 'This phone number is already registered'
                }
                break
              case 'name':
                if (['surname', 'firstname', 'lastname'].includes(field)) {
                  newErrors[field as keyof FormErrors] = 'This name combination is already registered'
                }
                break
              case 'similar_name':
                if (['surname', 'firstname', 'lastname'].includes(field)) {
                  newErrors[field as keyof FormErrors] = 'A similar name combination already exists'
                }
                break
            }
          })
          
          setErrors(prev => ({ ...prev, ...newErrors }))
        } else {
          // Clear any existing duplicate errors for this field
          setErrors(prev => {
            const newErrors = { ...prev }
            if (field === 'email' && prev.email?.includes('already registered')) {
              delete newErrors.email
            }
            if (field === 'phone' && prev.phone?.includes('already registered')) {
              delete newErrors.phone
            }
            if (['surname', 'firstname', 'lastname'].includes(field) && 
                (prev[field as keyof FormErrors]?.includes('already registered') || 
                 prev[field as keyof FormErrors]?.includes('similar name'))) {
              delete newErrors[field as keyof FormErrors]
            }
            return newErrors
          })
        }
      }
    } catch (error) {
      console.error('Real-time duplicate check failed:', error)
    } finally {
      setCheckingDuplicates(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing (except duplicate errors which are handled separately)
    if (errors[field] && !errors[field]?.includes('already registered') && !errors[field]?.includes('similar name')) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Debounced duplicate checking for specific fields
    if (['email', 'phone', 'surname', 'firstname', 'lastname'].includes(field)) {
      if (duplicateCheckTimeout) {
        clearTimeout(duplicateCheckTimeout)
      }
      
      const timeout = setTimeout(() => {
        checkFieldDuplicate(field, value)
      }, 800) // 800ms delay
      
      setDuplicateCheckTimeout(timeout)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return

    setLoading(true)
    setErrors({})

    try {
      // Check if registration is closed
      if (registrationSettings.isRegistrationClosed) {
        setErrors({ general: 'Registration is currently closed. Please try again later.' })
        return
      }

      // Validate form
      const formErrors = await validateForm()
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors)
        return
      }

      // Check for duplicates before submitting
      const duplicateErrors = await checkForDuplicates()
      if (Object.keys(duplicateErrors).length > 0) {
        setErrors(duplicateErrors)
        return
      }

      // Submit form
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      setSuccess(true)
      
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ 
        general: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Show success state similar to forgot password page
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
              Registration Successful!
            </h1>
            <p className="font-apercu-regular text-gray-600">
              Welcome to {systemName}
            </p>
          </div>

          <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-apercu-medium text-lg text-gray-900 mb-2">
                  Account Created Successfully
                </h3>
                <p className="font-apercu-regular text-gray-600 mb-4">
                  Welcome, <strong>{formData.surname} {formData.firstname} {formData.lastname}</strong>! Your account has been created successfully.
                </p>
                <p className="font-apercu-regular text-sm text-gray-500 mb-6">
                  A welcome email has been sent to <strong>{formData.email}</strong>. 
                  Please check your inbox for next steps and login instructions.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    disabled 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white opacity-75 cursor-not-allowed"
                  >
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting to Login in {countdown}s
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }



  // Show form closed message if registration is closed
  if (registrationSettings?.isFormClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 animate-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-apercu-bold text-xl text-gray-900 mb-2">
                Registration Closed
              </h3>
              <p className="font-apercu-regular text-gray-600 mb-4">
                The registration period has ended. Please contact the administrator for more information.
              </p>
              {registrationSettings?.formClosureDate && (
                <p className="font-apercu-regular text-sm text-gray-500 mb-6">
                  Registration closed on: {new Date(registrationSettings.formClosureDate).toLocaleDateString()}
                </p>
              )}
              <Link href="/">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-apercu-medium px-6 py-2">
                  Go Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#f1f1f1'}} suppressHydrationWarning={true}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" suppressHydrationWarning={true} />

      {/* Main Container */}
      <div className="w-full max-w-2xl animate-fade-in" suppressHydrationWarning={true}>
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
            Create Student Account
          </h1>
          
          <div className="flex items-center justify-center gap-2 mt-3 animate-fade-in animate-delay-300">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <span className="font-apercu-medium text-sm text-indigo-600">{systemName}</span>
          </div>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl border-2 border-[#efefef] bg-white/80 backdrop-blur-sm">
          <CardContent className="space-y-6">
            {errors.general && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="font-apercu-medium text-red-700">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Surname */}
                <div className="space-y-2">
                  <label htmlFor="surname" className="font-apercu-medium text-sm text-gray-700">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="surname"
                      name="surname"
                      type="text"
                      required
                      placeholder="Enter surname"
                      value={formData.surname}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                      className={`font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        errors.surname ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {checkingDuplicates.surname && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.surname && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.surname}</p>
                  )}
                </div>

                {/* First Name */}
                <div className="space-y-2">
                  <label htmlFor="firstname" className="font-apercu-medium text-sm text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="firstname"
                      name="firstname"
                      type="text"
                      required
                      placeholder="Enter first name"
                      value={formData.firstname}
                      onChange={(e) => handleInputChange('firstname', e.target.value)}
                      className={`font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        errors.firstname ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {checkingDuplicates.firstname && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.firstname && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.firstname}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label htmlFor="lastname" className="font-apercu-medium text-sm text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="lastname"
                      name="lastname"
                      type="text"
                      required
                      placeholder="Enter last name"
                      value={formData.lastname}
                      onChange={(e) => handleInputChange('lastname', e.target.value)}
                      className={`font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        errors.lastname ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {checkingDuplicates.lastname && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.lastname && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.lastname}</p>
                  )}
                </div>
              </div>

              {/* Email and Date of Birth Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block font-apercu-medium text-sm text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
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
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {checkingDuplicates.email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.email}</p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <ModernDatePicker
                    label="Date of Birth"
                    required={true}
                    value={formData.dateOfBirth}
                    onChange={(date) => {
                      handleInputChange('dateOfBirth', date)
                      // Clear error for this field when user selects a valid date
                      if (date && errors.dateOfBirth) {
                        setErrors(prev => ({ ...prev, dateOfBirth: '' }))
                      }
                    }}
                    placeholder="Select your date of birth"
                    error={!!errors.dateOfBirth}
                    maxDate={new Date().toISOString().split('T')[0]}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs font-apercu-regular flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              </div>

              {/* Gender and Phone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div className="space-y-2">
                  <label htmlFor="gender" className="font-apercu-medium text-sm text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger className={`h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                      errors.gender ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.gender}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="font-apercu-medium text-sm text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <InternationalPhoneInput
                      value={formData.phone}
                      onChange={(value, isValid) => {
                        handleInputChange('phone', value)
                        // You can use isValid for additional validation if needed
                      }}
                      error={!!errors.phone}
                      defaultCountry="NG"
                      placeholder="Enter your phone number"
                    />
                    {checkingDuplicates.phone && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Password Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="font-apercu-medium text-sm text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="font-apercu-medium text-sm text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`font-apercu-regular pl-10 pr-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs font-apercu-regular">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Password Requirements Component - Full Width */}
              {formData.password && (
                <div className="w-full opacity-0 page-enter-up" style={{
                  animation: 'slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                  animationDelay: '0.1s'
                }}>
                  <PasswordRequirements password={formData.password} />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-12 font-apercu-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  success 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                } text-white`}
              >
                {success ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <span className="text-white">Account Created! Redirecting...</span>
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white">Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex text-white items-center gap-2">
                    <span className="text-white">Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="font-apercu-regular text-sm text-gray-600 mb-3">
                Already have an account?
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-apercu-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <Shield className="w-4 h-4" />
                Sign In Instead
              </Link>
            </div>

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="font-apercu-regular text-sm text-gray-500">
            Secure Registration for <span className="font-apercu-regular text-sm text-gray-500">{systemName}</span> Management System
          </p>
        </div>
      </div>
    </div>
  )

}