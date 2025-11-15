"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { CourseTabs, CourseTabContent } from '@/components/ui/course-tabs'
import { Download, Edit, Mail, User, GraduationCap, IdCard, CalendarDays, Loader2, Check } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ModernDatePicker } from '@/components/ui/modern-date-picker'
// Removed FieldMeta import as type labels are no longer shown
import { useToast } from '@/contexts/ToastContext'

// Canonical list of Nigerian states for Origin selection
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Federal Capital Territory (Abuja)'
]

interface StudentData {
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  homeAddress?: string
  officePostalAddress?: string
  maritalStatus?: string
  spouseName?: string
  placeOfBirth?: string
  origin?: string
  presentOccupation?: string
  placeOfWork?: string
  positionHeldInOffice?: string
  acceptedJesusChrist?: boolean
  whenAcceptedJesus?: string
  churchAffiliation?: string
  schoolsAttended?: Array<{ institutionName: string; certificatesHeld: string }>
  courseDesired?: string
  profilePicture?: string | null
  status?: string
  matriculationNumber?: string | null
}

// Auto-save removed; debounce helper no longer needed

function toDateInputValue(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function computeCompletion(d: StudentData): number {
  const checks = [
    Boolean(d?.name?.trim()),
    Boolean(d?.dateOfBirth),
    Boolean(d?.gender),
    Boolean(d?.placeOfBirth?.trim()),
    Boolean(d?.origin?.trim()),
    Boolean(d?.maritalStatus),
    d?.maritalStatus === 'Married' ? Boolean(d?.spouseName?.trim()) : true,
    Boolean(d?.email?.trim()),
    Boolean(d?.phone?.trim()),
    Boolean(d?.homeAddress?.trim()),
    Boolean(d?.presentOccupation?.trim()),
    Boolean(d?.placeOfWork?.trim()),
    Boolean(d?.positionHeldInOffice?.trim()),
    (() => {
      const schools = d?.schoolsAttended || []
      return schools.length > 0 && schools.every((s) => s?.institutionName?.trim() && s?.certificatesHeld?.trim())
    })(),
    d?.acceptedJesusChrist !== undefined,
    d?.acceptedJesusChrist ? Boolean(d?.whenAcceptedJesus?.trim()) : true,
    Boolean(d?.churchAffiliation?.trim()),
  ]
  const total = checks.length
  const passed = checks.filter(Boolean).length
  return Math.round((passed / total) * 100)
}

export default function TestProfileMockPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('personalInfo')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialEditSnapshot, setInitialEditSnapshot] = useState<StudentData | null>(null)
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set())
  const { error: notifyError, success: notifySuccess } = useToast()

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await fetch('/api/student/profile')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setStudentData(data.user)
      } catch (e) {
        console.error('Error loading profile:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStudentData()
  }, [])

  const isEmpty = (val: any) => {
    if (val === null || val === undefined) return true
    if (typeof val === 'string') return val.trim().length === 0
    if (Array.isArray(val)) return val.length === 0
    return false
  }

  const validateProfile = (d: StudentData) => {
    const missing: string[] = []
    // Only validate user-editable fields on this page
    if (!d.dateOfBirth) missing.push('dateOfBirth')
    if (!d.gender) missing.push('gender')
    if (!d.placeOfBirth?.trim()) missing.push('placeOfBirth')
    if (!d.origin?.trim()) missing.push('origin')
    if (!d.maritalStatus) missing.push('maritalStatus')
    if (d.maritalStatus === 'Married' && !d.spouseName?.trim()) missing.push('spouseName')
    if (!d.homeAddress?.trim()) missing.push('homeAddress')
    if (!d.presentOccupation?.trim()) missing.push('presentOccupation')
    if (!d.placeOfWork?.trim()) missing.push('placeOfWork')
    if (!d.positionHeldInOffice?.trim()) missing.push('positionHeldInOffice')
    const schools = d.schoolsAttended || []
    if (schools.length === 0) {
      // push granular keys so we can focus precise inputs
      missing.push('schoolsAttended:0:institutionName')
    } else {
      for (let i = 0; i < schools.length; i++) {
        const s = schools[i]
        if (!s?.institutionName?.trim()) {
          missing.push(`schoolsAttended:${i}:institutionName`)
          break
        }
        if (!s?.certificatesHeld?.trim()) {
          missing.push(`schoolsAttended:${i}:certificatesHeld`)
          break
        }
      }
    }
    if (d.acceptedJesusChrist === undefined) missing.push('acceptedJesusChrist')
    if (d.acceptedJesusChrist && !d.whenAcceptedJesus?.trim()) missing.push('whenAcceptedJesus')
    if (!d.churchAffiliation?.trim()) missing.push('churchAffiliation')
    return missing
  }

  const recalcInvalidKeys = (d: StudentData) => {
    const missing = validateProfile(d)
    setInvalidKeys(new Set(missing))
  }

  useEffect(() => {
    if (studentData) recalcInvalidKeys(studentData)
  }, [studentData])

  const handleChange = (field: keyof StudentData, value: any) => {
    if (isEditing && initialEditSnapshot) {
      const initialVal = (initialEditSnapshot as any)[field]
      // Disallow clearing previously filled values
      if (!isEmpty(initialVal) && isEmpty(value)) {
        notifyError('Field cannot be empty', 'Previously filled information cannot be cleared')
        return
      }
      // Disallow changing certain identity/contact fields if they already exist in the database snapshot
      const lockedFields = new Set<keyof StudentData>(['name', 'email', 'homeAddress', 'phone'])
      if (lockedFields.has(field) && !isEmpty(initialVal)) {
        const normalize = (v: any) => (typeof v === 'string' ? v.trim() : v)
        if (normalize(value) !== normalize(initialVal)) {
          const labelMap: Record<string, string> = {
            name: 'Name',
            email: 'Email',
            homeAddress: 'Address',
            phone: 'Phone number',
          }
          const label = labelMap[String(field)] || String(field)
          notifyError('Change not allowed', `${label} is locked because it exists in your record. Please contact the administrator to update this information.`)
          return
        }
      }
    }
    setStudentData((prev) => {
      const next = { ...(prev as StudentData), [field]: value }
      recalcInvalidKeys(next)
      return next
    })
  }

  const nameToShow = studentData?.name?.trim() ? studentData.name.trim() : 'Unknown Student'
  const initials = nameToShow
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const completion = studentData ? computeCompletion(studentData) : 0

  const scrollAndFocusField = (key: string) => {
    // Normalize key and compute element id
    let targetId = `field-${key}`
    // For simple keys, try field-{key}
    let el = document.getElementById(targetId)
    if (!el) {
      // Fallback to data-field attribute container
      const container = document.querySelector(`[data-field='${key}']`) as HTMLElement | null
      if (container) {
        el = (container.querySelector('input, select, textarea, button') as HTMLElement) || container
      }
    }
    if (!el) {
      // For schoolsAttended granular keys, ensure id format exists
      const schoolMatch = key.match(/^schoolsAttended:(\d+):(institutionName|certificatesHeld)$/)
      if (schoolMatch) {
        targetId = `field-schoolsAttended-${schoolMatch[1]}-${schoolMatch[2]}`
        el = document.getElementById(targetId) as HTMLElement | null
      }
    }
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Attempt focus on focusable child if the element itself isn't focusable
        const focusable = (el.matches('input, select, textarea, button')
          ? el
          : (el.querySelector('input, select, textarea, button') as HTMLElement | null))
        ;(focusable || el).focus?.()
      } catch {}
    }
  }

  const fieldTabMap: Record<string, string> = {
    name: 'about', dateOfBirth: 'personalInfo', gender: 'personalInfo', placeOfBirth: 'about', origin: 'contact', maritalStatus: 'about', spouseName: 'about',
    email: 'personalInfo', phone: 'personalInfo', homeAddress: 'personalInfo', officePostalAddress: 'contact',
    schoolsAttended: 'schoolsAttended',
    presentOccupation: 'contact', placeOfWork: 'contact', positionHeldInOffice: 'contact',
    acceptedJesusChrist: 'about', whenAcceptedJesus: 'about', churchAffiliation: 'about'
  }

  const handleToggleEdit = () => {
    if (!studentData) return
    if (isEditing) {
      const missing = validateProfile(studentData)
      if (missing.length > 0) {
        const first = missing[0]
        const keyForTab = first.split(':')[0]
        setActiveTab(fieldTabMap[keyForTab] || fieldTabMap[first] || 'about')
        // Focus after tab content renders
        setTimeout(() => scrollAndFocusField(first), 60)
        notifyError('Incomplete profile', `Please fill: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? `, +${missing.length - 4} more` : ''}`)
        return
      }
      notifySuccess('Profile looks complete')
      setIsEditing(false)
      setInitialEditSnapshot(null)
    } else {
      setIsEditing(true)
      setInitialEditSnapshot(studentData)
      recalcInvalidKeys(studentData)
    }
  }

  // Step navigation helpers
  const canProceedFromTab = (missing: string[], tabId: string) => {
    // Filter missing keys that belong to the provided tab
    const missingInTab = missing.filter((m) => {
      const key = m.split(':')[0]
      return (fieldTabMap[key] || fieldTabMap[m]) === tabId
    })
    return { ok: missingInTab.length === 0, firstMissing: missingInTab[0] }
  }

  const handleNextStep = () => {
    if (!studentData) return
    const missing = validateProfile(studentData)
    const { ok, firstMissing } = canProceedFromTab(missing, activeTab)
    if (!ok) {
      notifyError('Incomplete step', 'Please fill required fields on this step')
      setTimeout(() => scrollAndFocusField(firstMissing!), 60)
      return
    }
    const order = ['personalInfo', 'about', 'contact', 'schoolsAttended']
    const idx = order.indexOf(activeTab)
    if (idx < order.length - 1) {
      setActiveTab(order[idx + 1])
    }
  }

  const handlePrevStep = () => {
    const order = ['personalInfo', 'about', 'contact', 'schoolsAttended']
    const idx = order.indexOf(activeTab)
    if (idx > 0) setActiveTab(order[idx - 1])
  }

  const handleSubmit = async () => {
    if (!studentData) return
    const missing = validateProfile(studentData)
    if (missing.length > 0) {
      const first = missing[0]
      const keyForTab = first.split(':')[0]
      setActiveTab(fieldTabMap[keyForTab] || fieldTabMap[first] || 'about')
      setTimeout(() => scrollAndFocusField(first), 60)
      notifyError('Incomplete profile', 'Please complete all required fields before submitting')
      return
    }
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/student/registration/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      })
      const payload = await res.json().catch(() => null)
      if (res.ok) {
        // Refresh profile to reflect matriculation number immediately
        try {
          const refresh = await fetch('/api/student/profile')
          if (refresh.ok) {
            const data = await refresh.json()
            setStudentData(data.user)
          }
        } catch (refreshErr) {
          console.warn('Profile refresh after verify failed:', refreshErr)
        }
        notifySuccess('Profile verified successfully, your Matric Number has been generated')
        setIsEditing(false)
        // If user was redirected here, resume the intended page
        const next = searchParams?.get('next')
        if (next && next.startsWith('/')) {
          try {
            router.push(next)
          } catch {}
        }
      } else {
        const msg = (payload && (payload.message || payload.error)) || 'Please try again later'
        notifyError('Profile verification failed', msg)
      }
    } catch (e) {
      console.error('Submit failed:', e)
      notifyError('Network error', 'Unable to submit at the moment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'personalInfo', label: 'Personal Information', count: 0, icon: IdCard },
    { id: 'about', label: 'About', count: 0, icon: User },
    { id: 'contact', label: 'Contact', count: 0, icon: Mail },
    { id: 'schoolsAttended', label: 'Schools Attended', count: 0, icon: GraduationCap },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 py-6">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <Card className="shadow-sm border border-gray-200 bg-white">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse mt-2 w-20" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Content Skeleton */}
            <Card className="shadow-sm border border-gray-200 bg-white">
              <div className="p-4 sm:p-6">
                <div className="h-5 bg-gray-200 rounded animate-pulse mb-4 w-40" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 py-6">
          <div className="text-gray-700">No profile data found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-6 space-y-6">

        {/* Header */}
        <Card className="shadow-sm border border-gray-200 bg-white px-3 py-4 sm:px-4 sm:py-6">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="gap-4 sm:flex sm:items-start">
                <Avatar className="h-16 w-16">
                  {studentData.profilePicture ? (
                    <AvatarImage src={studentData.profilePicture} alt={nameToShow} />
                  ) : null}
                  <AvatarFallback className="bg-indigo-600 text-white font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={studentData?.name || ''}
                    readOnly
                    disabled
                    className="text-xl font-semibold truncate px-2 rounded h-10 min-w-[200px] bg-gray-100 cursor-not-allowed border-0 focus:outline-none"
                  />
                  {studentData.matriculationNumber && (
                    <Badge variant="outline" className="text-indigo-700 border-indigo-200">
                      {studentData.matriculationNumber}
                    </Badge>
                  )}
                  {studentData.status && (
                    <Badge variant="outline" className="text-green-700 border-green-200">{studentData.status}</Badge>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600 truncate flex items-center gap-2">
                  <input
                    type="text"
                    value={studentData.courseDesired || ''}
                    readOnly
                    disabled
                    className="px-2 rounded h-9 min-w-[160px] bg-gray-100 cursor-not-allowed border-0 focus:outline-none"
                    placeholder="Program"
                  />
                  
                </div>
              </div>
              {/* Header actions */}
              <div className="row-start-2 sm:row-start-auto sm:col-start-2 flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end mt-3 sm:mt-0 sm:justify-self-end">
                <Card className="p-2 sm:p-3 bg-indigo-50 border border-indigo-200 rounded-lg w-full sm:w-auto">
                  <div className="flex items-center justify-end w-full">
                    <Button
                      className={`w-full sm:w-auto whitespace-nowrap px-6 py-3 text-base sm:px-4 sm:py-2 sm:text-sm ${isEditing ? 'bg-green-500 hover:bg-green-600 text-white border-0' : 'bg-indigo-600 hover:bg-indigo-700 text-white border-0 focus:ring-2 focus:ring-indigo-500'}`}
                      variant="default"
                      size="default"
                      onClick={handleToggleEdit}
                    >
                      {isEditing ? <Check className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                      {isEditing ? 'Finish Editing' : 'Edit Profile'}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
          </div>
        </Card>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Main column (full width) */}
          <div className="space-y-6">

            {/* Tabs */}
            <Card className="text-card-foreground flex flex-col space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 rounded-xl shadow-sm border border-gray-200 bg-white px-3 py-4 sm:px-2 sm:py-6">
              <CardContent className="px-2 pt-6">
                <div className="w-full mb-6">
                  <div className="flex justify-between bg-gray-100 rounded-2xl p-1.5 shadow-inner overflow-x-auto">
                    <button
                      aria-disabled
                      className={`flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 rounded-xl font-apercu-medium text-xs sm:text-sm transition-all duration-300 ease-in-out transform whitespace-nowrap min-w-fit ${activeTab === 'personalInfo' ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]' : 'text-gray-600'} pointer-events-none cursor-default`}
                    >
                      <div className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${activeTab === 'personalInfo' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}>
                        <IdCard className={`h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 transition-all duration-300 ${activeTab === 'personalInfo' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className={`flex flex-col items-start min-w-0 ${activeTab === 'personalInfo' ? 'flex' : 'hidden'} sm:flex`}>
                        <span className={`font-apercu-bold text-xs sm:text-sm truncate ${activeTab === 'personalInfo' ? 'text-white' : 'text-gray-600'}`}>Personal Information</span>
                      </div>
                    </button>

                    <button
                      aria-disabled
                      className={`flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 rounded-xl font-apercu-medium text-xs sm:text-sm transition-all duration-300 ease-in-out transform whitespace-nowrap min-w-fit ${activeTab === 'about' ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]' : 'text-gray-600'} pointer-events-none cursor-default`}
                    >
                      <div className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${activeTab === 'about' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}>
                        <User className={`h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 transition-all duration-300 ${activeTab === 'about' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className={`flex flex-col items-start min-w-0 ${activeTab === 'about' ? 'flex' : 'hidden'} sm:flex`}>
                        <span className={`font-apercu-bold text-xs sm:text-sm truncate ${activeTab === 'about' ? 'text-white' : 'text-gray-600'}`}>About</span>
                      </div>
                    </button>

                    <button
                      aria-disabled
                      className={`flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 rounded-xl font-apercu-medium text-xs sm:text-sm transition-all duration-300 ease-in-out transform whitespace-nowrap min-w-fit ${activeTab === 'contact' ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]' : 'text-gray-600'} pointer-events-none cursor-default`}
                    >
                      <div className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${activeTab === 'contact' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}>
                        <Mail className={`h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 transition-all duration-300 ${activeTab === 'contact' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className={`flex flex-col items-start min-w-0 ${activeTab === 'contact' ? 'flex' : 'hidden'} sm:flex`}>
                        <span className={`font-apercu-bold text-xs sm:text-sm truncate ${activeTab === 'contact' ? 'text-white' : 'text-gray-600'}`}>Contact</span>
                      </div>
                    </button>

                    <button
                      aria-disabled
                      className={`flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 rounded-xl font-apercu-medium text-xs sm:text-sm transition-all duration-300 ease-in-out transform whitespace-nowrap min-w-fit ${activeTab === 'schoolsAttended' ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]' : 'text-gray-600'} pointer-events-none cursor-default`}
                    >
                      <div className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${activeTab === 'schoolsAttended' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}>
                        <GraduationCap className={`h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 transition-all duration-300 ${activeTab === 'schoolsAttended' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className={`flex flex-col items-start min-w-0 ${activeTab === 'schoolsAttended' ? 'flex' : 'hidden'} sm:flex`}>
                        <span className={`font-apercu-bold text-xs sm:text-sm truncate ${activeTab === 'schoolsAttended' ? 'text-white' : 'text-gray-600'}`}>Schools Attended</span>
                      </div>
                    </button>
                  </div>
                </div>
                {activeTab === 'personalInfo' && (
                  <CourseTabContent activeTab={activeTab}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <label className="text-gray-700 font-medium">Gender</label>
                        <div className="mt-2 w-56 sm:w-64 lg:w-72">
                          <Select
                            value={studentData.gender || ''}
                            onValueChange={(val) => { if (!isEditing) return; handleChange('gender', val) }}
                          >
                            <SelectTrigger id="field-gender" className={`h-10 border-gray-300 ${
                              isEditing ? 'focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 cursor-not-allowed pointer-events-none opacity-60'
                            } ${invalidKeys.has('gender') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-50">
                              <SelectItem className="bg-gray-50" value="Male">Male</SelectItem>
                              <SelectItem className="bg-gray-50" value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-700 font-medium">Date of Birth</label>
                        <div id="field-dateOfBirth" data-field="dateOfBirth" className={`mt-2 w-56 sm:w-64 lg:w-72 ${invalidKeys.has('dateOfBirth') ? 'ring-1 ring-red-500 rounded' : ''}`}>
                          <ModernDatePicker
                            label=""
                            value={toDateInputValue(studentData.dateOfBirth)}
                            onChange={(date) => handleChange('dateOfBirth', date)}
                            disabled={!isEditing}
                            maxDate={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-700 font-medium">Email</label>
                        <input
                          type="email"
                          value={studentData.email || ''}
                          onChange={(e) => handleChange('email' as any, e.target.value)}
                          disabled={!isEditing}
                          className={`mt-2 font-medium px-3 h-10 min-w-[200px] rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border border-gray-200'} ${invalidKeys.has('email') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none w-full`}
                        />
                      </div>

                      <div>
                        <label className="text-gray-700 font-medium">Phone</label>
                        <input
                          type="tel"
                          value={studentData.phone || ''}
                          onChange={(e) => handleChange('phone' as any, e.target.value)}
                          disabled={!isEditing}
                          className={`mt-2 font-medium px-3 h-10 min-w-[200px] rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border border-gray-200'} ${invalidKeys.has('phone') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none w-full`}
                        />
                      </div>

                      <div>
                        <label className="text-gray-700 font-medium">Home Address</label>
                        <Textarea
                          value={studentData.homeAddress || ''}
                          onChange={(e) => handleChange('homeAddress' as any, e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className={`mt-2 font-medium px-3 min-w-[200px] rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border border-gray-200'} ${invalidKeys.has('homeAddress') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none w-full`}
                        />
                      </div>
                    </div>
                  </CourseTabContent>
                )}
                {activeTab === 'about' && (
                  <CourseTabContent activeTab={activeTab}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-gray-700">
                          <span className="font-medium">Bio</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="space-y-4">
                            <div>
                        <label className="text-gray-700 font-medium">Place of Birth</label>
                        <input
                          type="text"
                          id="field-placeOfBirth"
                          value={studentData.placeOfBirth || ''}
                          onChange={(e) => handleChange('placeOfBirth', e.target.value)}
                          disabled={!isEditing}
                          className={`mt-2 font-medium px-3 h-10 w-full rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border border-gray-200'} ${invalidKeys.has('placeOfBirth') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none`}
                        />
                      </div>
                      
                      <div>
                        <label className="text-gray-700 font-medium">Marital Status</label>
                        <div className="mt-2 w-full">
                          <Select
                            value={studentData.maritalStatus || ''}
                            onValueChange={(val) => { if (!isEditing) return; handleChange('maritalStatus', val) }}
                          >
                            <SelectTrigger id="field-maritalStatus" className={`h-10 border-gray-300 bg-gray-50 ${
                              isEditing ? 'focus:border-indigo-500 focus:ring-indigo-500' : 'cursor-not-allowed pointer-events-none opacity-60'
                            } ${invalidKeys.has('maritalStatus') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-50">
                                    <SelectItem className="bg-gray-50" value="Single">Single</SelectItem>
                                    <SelectItem className="bg-gray-50" value="Married">Married</SelectItem>
                                    <SelectItem className="bg-gray-50" value="Divorced">Divorced</SelectItem>
                                    <SelectItem className="bg-gray-50" value="Widowed">Widowed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {studentData.maritalStatus === 'Married' && (
                              <div>
                                <label className="text-gray-700 font-medium">Spouse Name</label>
                                <input
                                  type="text"
                                  id="field-spouseName"
                                  value={studentData.spouseName || ''}
                                  onChange={(e) => handleChange('spouseName', e.target.value)}
                                  disabled={!isEditing}
                                  className={`mt-2 font-medium px-3 h-10 w-full rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border border-gray-200'} ${invalidKeys.has('spouseName') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-gray-700">
                          <span className="font-medium">Spiritual</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="space-y-4">
                            <div>
                              <label className="text-gray-700 font-medium">Accepted Jesus Christ</label>
                              <div className="mt-2 w-full">
                                <Select
                                  value={
                                    studentData.acceptedJesusChrist === undefined
                                      ? ''
                                      : studentData.acceptedJesusChrist
                                      ? 'yes'
                                      : 'no'
                                  }
                                  onValueChange={(val) => { if (!isEditing) return; handleChange('acceptedJesusChrist', val === 'yes') }}
                                >
                                  <SelectTrigger id="field-acceptedJesusChrist" className={`h-10 border-gray-300 bg-gray-50 ${isEditing ? 'focus:border-indigo-500 focus:ring-indigo-500' : 'cursor-not-allowed pointer-events-none opacity-60'} ${invalidKeys.has('acceptedJesusChrist') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-50">
                                    <SelectItem className="bg-gray-50" value="yes">Yes</SelectItem>
                                    <SelectItem className="bg-gray-50" value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {studentData.acceptedJesusChrist && (
                              <div>
                                <label className="text-gray-700 font-medium">When Accepted</label>
                                <div id="field-whenAcceptedJesus" data-field="whenAcceptedJesus" className={`mt-2 w-full ${invalidKeys.has('whenAcceptedJesus') ? 'ring-1 ring-red-500 rounded' : ''}`}>
                                  <ModernDatePicker
                                    label=""
                                    value={toDateInputValue(studentData.whenAcceptedJesus)}
                                    onChange={(date) => handleChange('whenAcceptedJesus', date)}
                                    disabled={!isEditing}
                                    maxDate={new Date().toISOString().split('T')[0]}
                                  />
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="text-gray-700 font-medium">Church Affiliation</label>
                              <input
                                type="text"
                                id="field-churchAffiliation"
                                value={studentData.churchAffiliation || ''}
                                onChange={(e) => handleChange('churchAffiliation', e.target.value)}
                                disabled={!isEditing}
                                className={`mt-2 font-medium px-3 h-10 w-full rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border border-gray-200'} ${invalidKeys.has('churchAffiliation') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CourseTabContent>
                )}
                {activeTab === 'contact' && (
                  <CourseTabContent activeTab={activeTab}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-4">
                        <div>
                          <label className="text-gray-700 font-medium">State of Origin</label>
                          <div className="mt-2 w-full">
                            <Select
                              value={studentData.origin || ''}
                              onValueChange={(val) => { if (!isEditing) return; handleChange('origin', val) }}
                            >
                              <SelectTrigger id="field-origin" className={`h-10 border-gray-300 bg-gray-50 ${
                                isEditing ? 'focus:border-indigo-500 focus:ring-indigo-500' : 'cursor-not-allowed pointer-events-none opacity-60'
                              } ${invalidKeys.has('origin') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                                <SelectValue placeholder="Select state of origin" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-50">
                                {NIGERIAN_STATES.map((state) => (
                                  <SelectItem key={state} value={state} className="bg-gray-50">{state}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-gray-700 font-medium">Present Occupation</label>
                          <input
                            type="text"
                            id="field-presentOccupation"
                            value={studentData.presentOccupation || ''}
                            onChange={(e) => handleChange('presentOccupation', e.target.value)}
                            disabled={!isEditing}
                            className={`mt-2 font-medium px-3 h-10 rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border-0'} ${invalidKeys.has('presentOccupation') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none w-full`}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-gray-700 font-medium">Place of Work</label>
                          <input
                            type="text"
                            id="field-placeOfWork"
                            value={studentData.placeOfWork || ''}
                            onChange={(e) => handleChange('placeOfWork', e.target.value)}
                            disabled={!isEditing}
                            className={`mt-2 font-medium px-3 h-10 rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border-0'} ${invalidKeys.has('placeOfWork') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none w-full`}
                          />
                        </div>
                        <div>
                          <label className="text-gray-700 font-medium">Position Held In Office</label>
                          <input
                            type="text"
                            id="field-positionHeldInOffice"
                            value={studentData.positionHeldInOffice || ''}
                            onChange={(e) => handleChange('positionHeldInOffice', e.target.value)}
                            disabled={!isEditing}
                            className={`mt-2 font-medium px-3 h-10 rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border-0'} ${invalidKeys.has('positionHeldInOffice') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} focus:outline-none w-full`}
                          />
                        </div>
                      </div>
                    </div>
                  </CourseTabContent>
                )}
                {activeTab === 'schoolsAttended' && (
                  <CourseTabContent activeTab={activeTab}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <GraduationCap className="h-4 w-4" />
                        <span className="font-medium">Schools Attended</span>
                      </div>
                      <div className="space-y-3 text-sm">
                        {((studentData?.schoolsAttended && (studentData.schoolsAttended.length > 0))
                          ? studentData.schoolsAttended
                          : [{ institutionName: '', certificatesHeld: '' }]
                        ).map((school, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded">
                            <div>
                              <label className="text-gray-700 font-medium">Institution Name</label>
                          <input
                            type="text"
                            id={`field-schoolsAttended-${idx}-institutionName`}
                            value={school.institutionName || ''}
                            onChange={(e) => {
                              const next = [...(studentData?.schoolsAttended || [])]
                              const initialVal = initialEditSnapshot?.schoolsAttended?.[idx]?.institutionName || ''
                              const newVal = e.target.value
                              if (isEditing && initialVal.trim() && newVal.trim() === '') {
                                notifyError('Field cannot be empty', 'Previously filled information cannot be cleared')
                                return
                              }
                              next[idx] = { ...next[idx], institutionName: newVal }
                              setStudentData((prev) => {
                                const d = { ...(prev as StudentData), schoolsAttended: next }
                                recalcInvalidKeys(d)
                                return d
                              })
                            }}
                            disabled={!isEditing}
                            className={`mt-2 font-medium px-3 h-10 rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border border-gray-200'} focus:outline-none w-full`}
                          />
                        </div>
                        <div>
                          <label className="text-gray-700 font-medium">Certificates Held</label>
                          <input
                            type="text"
                            id={`field-schoolsAttended-${idx}-certificatesHeld`}
                            value={school.certificatesHeld || ''}
                            onChange={(e) => {
                              const next = [...(studentData?.schoolsAttended || [])]
                              const initialVal = initialEditSnapshot?.schoolsAttended?.[idx]?.certificatesHeld || ''
                              const newVal = e.target.value
                              if (isEditing && initialVal.trim() && newVal.trim() === '') {
                                notifyError('Field cannot be empty', 'Previously filled information cannot be cleared')
                                return
                              }
                              next[idx] = { ...next[idx], certificatesHeld: newVal }
                              setStudentData((prev) => {
                                const d = { ...(prev as StudentData), schoolsAttended: next }
                                recalcInvalidKeys(d)
                                return d
                              })
                            }}
                            disabled={!isEditing}
                            className={`mt-2 font-medium px-3 h-10 rounded ${isEditing ? 'bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border-0'} focus:outline-none w-full`}
                          />
                        </div>
                            {isEditing && ((studentData?.schoolsAttended || []).length > 1) && (
                              <div className="md:col-span-2 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                                  onClick={() => {
                                const next = (studentData?.schoolsAttended || []).filter((_, i) => i !== idx)
                                setStudentData((prev) => {
                                  const d = { ...(prev as StudentData), schoolsAttended: next }
                                  recalcInvalidKeys(d)
                                  return d
                                })
                              }}
                            >Remove</Button>
                              </div>
                            )}
                          </div>
                        ))}
                        {isEditing && (
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white border-0"
                              onClick={() => {
                                const next = [...(studentData?.schoolsAttended || [])]
                                next.push({ institutionName: '', certificatesHeld: '' })
                                setStudentData((prev) => {
                                  const d = { ...(prev as StudentData), schoolsAttended: next }
                                  recalcInvalidKeys(d)
                                  return d
                                })
                              }}
                            >Add School</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CourseTabContent>
                )}

                {/* Step navigation */}
                <div className="mt-6 flex items-center justify-between">
                  <Button variant="outline" onClick={handlePrevStep} disabled={isSubmitting || activeTab === 'personalInfo'}>
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {(['personalInfo','about','contact','schoolsAttended'].indexOf(activeTab) < 3) ? (
                      <Button onClick={handleNextStep} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Next
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                        {isSubmitting ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting…</span>) : 'Submit'}
                      </Button>
                    )}
                  </div>
                </div>
                
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}