'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, User, Home, Briefcase, GraduationCap, Heart, ChevronDown, Check, Info, Loader2 } from 'lucide-react'
import { ModernDatePicker } from '@/components/ui/modern-date-picker'
import { toast } from 'sonner'
import { StudentLayout } from '@/components/student/StudentLayout'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'

// Debounce utility function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

interface StudentData {
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  // Fields from attachment form
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
  schoolsAttended?: Array<{
    institutionName: string
    certificatesHeld: string
  }>
  courseDesired?: string
  profilePicture?: string | null
  status?: string
}

// Format any stored date string to YYYY-MM-DD for date inputs
function toDateInputValue(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Information', icon: User },
  { id: 'contact', title: 'Contact & Address', icon: Home },
  { id: 'professional', title: 'Professional Details', icon: Briefcase },
  { id: 'education', title: 'Education & Course', icon: GraduationCap },
  { id: 'spiritual', title: 'Spiritual Information', icon: Heart }
]

export default function StudentProfilePage() {
  const router = useRouter()
  const [studentData, setStudentData] = useState<StudentData>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    homeAddress: '',
    officePostalAddress: '',
    maritalStatus: '',
    spouseName: '',
    placeOfBirth: '',
    origin: '',
    presentOccupation: '',
    placeOfWork: '',
    positionHeldInOffice: '',
    acceptedJesusChrist: false,
    whenAcceptedJesus: '',
    churchAffiliation: '',
    schoolsAttended: [],
    courseDesired: '',
    profilePicture: null,
    status: ''
  })
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState(false)

  // Refs for form inputs to enable focus navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({})

  const setInputRef = (name: string) => (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => {
    inputRefs.current[name] = el
  }

  // Field validation for each step
  const validateStep = (stepIndex: number): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}
    
    switch (stepIndex) {
      case 0: // Personal Information
        if (!studentData?.name?.trim()) errors.name = 'Name is required'
        if (!studentData?.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'
        if (!studentData?.gender) errors.gender = 'Gender is required'
        if (!studentData?.placeOfBirth?.trim()) errors.placeOfBirth = 'Place of birth is required'
        if (!studentData?.origin?.trim()) errors.origin = 'Origin is required'
        if (!studentData?.maritalStatus) errors.maritalStatus = 'Marital status is required'
        if (studentData?.maritalStatus === 'Married' && !studentData?.spouseName?.trim()) {
          errors.spouseName = 'Spouse name is required for married status'
        }
        break
      case 1: // Contact & Address
        if (!studentData?.email?.trim()) errors.email = 'Email is required'
        if (!studentData?.phone?.trim()) errors.phoneNumber = 'Phone number is required'
        if (!studentData?.homeAddress?.trim()) errors.address = 'Home address is required'
        if (!studentData?.officePostalAddress?.trim()) errors.officeAddress = 'Office/Postal address is required'
        break
      case 2: // Professional Details
        if (!studentData?.presentOccupation?.trim()) errors.occupation = 'Occupation is required'
        if (!studentData?.placeOfWork?.trim()) errors.employer = 'Place of work is required'
        if (!studentData?.positionHeldInOffice?.trim()) errors.position = 'Position is required'
        break
      case 3: // Education & Course
        // Schools Attended must have at least one entry, and all fields filled
        const schools = studentData?.schoolsAttended || []
        const hasValidSchools = schools.length > 0 && schools.every(s => s.institutionName?.trim() && s.certificatesHeld?.trim())
        if (!hasValidSchools) {
          errors.schoolsAttended = 'Provide institution name and certificates for each school'
        }
        // Course Desired is disabled and not required on this step
        break
      case 4: // Spiritual Information
        if (studentData?.acceptedJesusChrist === undefined) errors.acceptedJesus = 'Please indicate if you have accepted Jesus Christ'
        if (studentData?.acceptedJesusChrist === true && !studentData?.whenAcceptedJesus?.trim()) {
          errors.whenAcceptedJesus = 'Please specify when you accepted Jesus'
        }
        if (!studentData?.churchAffiliation?.trim()) errors.churchName = 'Church affiliation is required'
        break
    }
    
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = async () => {
    // Validate current step
    const { isValid, errors } = validateStep(currentStep)
    setValidationErrors(errors)
    
    if (!isValid) {
      
      // Focus on the first empty required field
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField && inputRefs.current[firstErrorField]) {
        inputRefs.current[firstErrorField]?.focus()
        inputRefs.current[firstErrorField]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
      return
    }
    
    // Skip saving on Next Step per request
    
    // Move to next step or complete
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      setValidationErrors({}) // Clear errors when moving to next step
    } else {
      setIsSubmitting(true)
      try {
        const res = await fetch('/api/student/registration/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData)
        })
        if (res.ok) {
          const data = await res.json()
          setVerifyResult(data)
          setProfileCompleted(true)
          setIsEditing(false)
          setShowSuccessModal(true)
        } else {
          const err = await res.json().catch(() => ({}))
          toast.error('Profile completion sync failed', {
            description: err?.error || err?.message || 'Please try again.'
          })
          setIsSubmitting(false)
        }
      } catch (e) {
        console.error('Verify sync error:', e)
        toast.error('Network error syncing completion')
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setValidationErrors({})
    } else {
      router.back()
    }
  }

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch('/api/student/profile')
        if (response.ok) {
          const data = await response.json()
          setStudentData(data.user)
        } else {
          toast.error('Failed to load profile data')
        }
      } catch (error) {
        console.error('Error fetching student data:', error)
        toast.error('Error loading profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [])

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const handleInputChange = (field: string, value: any) => {
    setStudentData(prev => ({
      ...prev,
      [field]: value
    }))
    // Auto-save after a short delay
    debouncedSave()
  }

  const debouncedSave = React.useCallback(
    debounce(async () => {
      await saveProfile()
    }, 1000),
    [studentData]
  )

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      })

      if (response.ok) {
        // Silent save - no toast notification for auto-saves
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const renderPersonalInformation = () => (
    <div className="space-y-6">
      {/* Name Fields - Group of 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surname <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={studentData?.name?.split(' ').pop() || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 cursor-not-allowed"
            placeholder="Enter surname"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={studentData?.name?.split(' ')[0] || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 cursor-not-allowed"
            placeholder="Enter first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={studentData?.name?.split(' ').slice(1, -1).join(' ') || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 cursor-not-allowed"
            placeholder="Enter last name"
          />
        </div>
      </div>

      {/* Date of Birth and Gender - Group of 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            ref={setInputRef('dateOfBirth')}
            type="text"
            value={studentData?.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString() : ''}
            readOnly
            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 cursor-not-allowed ${
              validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Select your date of birth"
          />
          {validationErrors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.dateOfBirth}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <input
            ref={setInputRef('gender')}
            type="text"
            value={studentData?.gender || ''}
            readOnly
            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 cursor-not-allowed ${
              validationErrors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Select gender"
          />
          {validationErrors.gender && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.gender}</p>
          )}
        </div>
      </div>

      {/* Place of Birth and Origin - Group of 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Place of Birth <span className="text-red-500">*</span>
          </label>
          <input
            ref={setInputRef('placeOfBirth')}
            type="text"
            value={studentData?.placeOfBirth || ''}
            onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
             disabled={!isEditing}
             className={`w-full px-3 py-2 border rounded-md ${
               isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
             } ${validationErrors.placeOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
             placeholder="Enter place of birth"
           />
           {validationErrors.placeOfBirth && (
             <p className="text-red-500 text-sm mt-1">{validationErrors.placeOfBirth}</p>
           )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Origin <span className="text-red-500">*</span>
          </label>
          <input
            ref={setInputRef('origin')}
            type="text"
            value={studentData?.origin || ''}
            onChange={(e) => handleInputChange('origin', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
            } ${validationErrors.origin ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Enter origin"
          />
          {validationErrors.origin && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.origin}</p>
          )}
        </div>
      </div>

      {/* Marital Status and Spouse Name - Group of 2 (conditional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marital Status <span className="text-red-500">*</span>
          </label>
          <select
            ref={setInputRef('maritalStatus')}
            value={studentData?.maritalStatus || ''}
            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
            } ${validationErrors.maritalStatus ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
          >
            <option value="">Select marital status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          {validationErrors.maritalStatus && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.maritalStatus}</p>
          )}
        </div>
        {studentData?.maritalStatus === 'Married' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name of Spouse <span className="text-red-500">*</span>
            </label>
            <input
              ref={setInputRef('spouseName')}
              type="text"
              value={studentData?.spouseName || ''}
              onChange={(e) => handleInputChange('spouseName', e.target.value)}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border rounded-md ${
                isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
              } ${validationErrors.spouseName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter spouse name"
            />
            {validationErrors.spouseName && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.spouseName}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderContactInformation = () => (
    <div className="space-y-6">
      {/* Email and Phone - Group of 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={studentData?.email || ''}
            readOnly
            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 cursor-not-allowed ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={studentData?.phone || ''}
            readOnly
            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 cursor-not-allowed ${
              validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
          />
          {validationErrors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
          )}
        </div>
      </div>

       {/* Home Address and Office/Postal Address - Group of 2 */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Home Address <span className="text-red-500">*</span>
           </label>
           <textarea
             ref={setInputRef('address')}
             value={studentData?.homeAddress || ''}
             onChange={(e) => handleInputChange('homeAddress', e.target.value)}
             disabled={!isEditing}
             className={`w-full px-3 py-2 border rounded-md ${
               isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
             } ${validationErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
             rows={3}
             placeholder="Enter your home address"
           />
           {validationErrors.address && (
             <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
           )}
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Office/Postal Address <span className="text-red-500">*</span>
           </label>
           <textarea
             ref={setInputRef('officeAddress')}
             value={studentData?.officePostalAddress || ''}
             onChange={(e) => handleInputChange('officePostalAddress', e.target.value)}
             disabled={!isEditing}
             className={`w-full px-3 py-2 border rounded-md ${
               isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
             } ${validationErrors.officeAddress ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
             rows={3}
             placeholder="Enter your office or postal address"
           />
           {validationErrors.officeAddress && (
             <p className="text-red-500 text-sm mt-1">{validationErrors.officeAddress}</p>
           )}
         </div>
       </div>
    </div>
  )

  const renderProfessionalInformation = () => (
    <div className="space-y-6">
      {/* Present Occupation and Place of Work - Group of 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Present Occupation <span className="text-red-500">*</span>
          </label>
          <input
            ref={setInputRef('occupation')}
            type="text"
            value={studentData?.presentOccupation || ''}
            onChange={(e) => handleInputChange('presentOccupation', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
            } ${validationErrors.occupation ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Enter your current occupation"
          />
          {validationErrors.occupation && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.occupation}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Place of Work <span className="text-red-500">*</span>
          </label>
          <input
            ref={setInputRef('employer')}
            type="text"
            value={studentData?.placeOfWork || ''}
            onChange={(e) => handleInputChange('placeOfWork', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
            } ${validationErrors.employer ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Enter your workplace"
          />
          {validationErrors.employer && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.employer}</p>
          )}
        </div>
      </div>

      {/* Position Held in the Office - Single field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position Held in the Office <span className="text-red-500">*</span>
        </label>
        <input
          ref={setInputRef('position')}
          type="text"
          value={studentData?.positionHeldInOffice || ''}
          onChange={(e) => handleInputChange('positionHeldInOffice', e.target.value)}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border rounded-md ${
            isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
          } ${validationErrors.position ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
          placeholder="Enter your position/title"
        />
        {validationErrors.position && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.position}</p>
        )}
      </div>
    </div>
  )

  const renderEducationInformation = () => (
    <div className="space-y-6">
      {/* Schools Attended */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Schools Attended <span className="text-red-500">*</span>
        </label>
        <div className="space-y-4">
          {(studentData?.schoolsAttended?.length ? studentData.schoolsAttended : [{ institutionName: '', certificatesHeld: '' }]).map((school, index) => {
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ({index + 1}) Name of Institution
                  </label>
                  <input
                    required
                    aria-required="true"
                    ref={index === 0 ? setInputRef('schoolsAttended') : undefined}
                    type="text"
                    value={school?.institutionName || ''}
                    onChange={(e) => {
                      const updatedSchools = [...(studentData?.schoolsAttended || [])]
                      if (!updatedSchools[index]) {
                        updatedSchools[index] = { institutionName: '', certificatesHeld: '' }
                      }
                      updatedSchools[index].institutionName = e.target.value
                      handleInputChange('schoolsAttended', updatedSchools)
                    }}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'}`}
                    placeholder="Enter institution name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Certificates Held
                  </label>
                  <input
                    required
                    aria-required="true"
                    type="text"
                    value={school?.certificatesHeld || ''}
                    onChange={(e) => {
                      const updatedSchools = [...(studentData?.schoolsAttended || [])]
                      if (!updatedSchools[index]) {
                        updatedSchools[index] = { institutionName: '', certificatesHeld: '' }
                      }
                      updatedSchools[index].certificatesHeld = e.target.value
                      handleInputChange('schoolsAttended', updatedSchools)
                    }}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'}`}
                    placeholder="Enter certificates obtained"
                  />
                </div>
                {index > 0 && (
                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={!isEditing}
                      onClick={() => {
                        const updatedSchools = [...(studentData?.schoolsAttended || [])]
                        if (updatedSchools[index]) {
                          updatedSchools.splice(index, 1)
                          handleInputChange('schoolsAttended', updatedSchools)
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {validationErrors.schoolsAttended && (
          <p className="text-red-500 text-sm mt-2">{validationErrors.schoolsAttended}</p>
        )}
        <div className="mt-3 flex justify-center">
          <Button
            type="button"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
            disabled={!isEditing}
            onClick={() => {
              const base = studentData?.schoolsAttended && studentData.schoolsAttended.length > 0
                ? studentData.schoolsAttended
                : [{ institutionName: '', certificatesHeld: '' }]
              handleInputChange('schoolsAttended', [...base, { institutionName: '', certificatesHeld: '' }])
            }}
          >
            Add More
          </Button>
        </div>
      </div>

      {/* Course Desired - Disabled display matching surname/firstname */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Desired <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={studentData?.courseDesired || ''}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 cursor-not-allowed"
          placeholder="Course desired (not editable)"
        />
      </div>
    </div>
  )

  const renderSpiritualInformation = () => (
    <div className="space-y-6">
      {/* Accepted Jesus Christ and When - Group of 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Have you ever accepted Jesus Christ as your Lord and Saviour? <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 w-full md:w-64">
            <Select
              value={
                studentData?.acceptedJesusChrist === undefined
                  ? ''
                  : studentData.acceptedJesusChrist
                  ? 'yes'
                  : 'no'
              }
              onValueChange={(val) => { if (!isEditing) return; handleInputChange('acceptedJesusChrist', val === 'yes') }}
            >
              <SelectTrigger className={`h-10 border-gray-300 ${
                isEditing ? 'focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 cursor-not-allowed pointer-events-none opacity-60'
              } ${validationErrors.acceptedJesus ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {validationErrors.acceptedJesus && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.acceptedJesus}</p>
          )}
        </div>
        {studentData?.acceptedJesusChrist === true && (
          <div>
            <ModernDatePicker
              label="When (if applicable)"
              value={toDateInputValue(studentData?.whenAcceptedJesus)}
              onChange={(date) => handleInputChange('whenAcceptedJesus', date)}
              placeholder="Select date"
              disabled={!isEditing}
              maxDate={new Date().toISOString().split('T')[0]}
              error={!!validationErrors.whenAcceptedJesus}
            />
            {validationErrors.whenAcceptedJesus && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.whenAcceptedJesus}</p>
            )}
          </div>
        )}
      </div>

      {/* Church Affiliation - Single field */}
      <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Church Affiliation <span className="text-red-500">*</span>
          </label>
          <input
            ref={setInputRef('churchName')}
            type="text"
            value={studentData?.churchAffiliation || ''}
            onChange={(e) => handleInputChange('churchAffiliation', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 cursor-not-allowed'
            } ${validationErrors.churchName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Enter your church affiliation"
          />
          {validationErrors.churchName && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.churchName}</p>
          )}
        </div>
    </div>
  )

  const renderStepContent = () => {
    switch (FORM_STEPS[currentStep].id) {
      case 'personal':
        return renderPersonalInformation()
      case 'contact':
        return renderContactInformation()
      case 'professional':
        return renderProfessionalInformation()
      case 'education':
        return renderEducationInformation()
      case 'spiritual':
        return renderSpiritualInformation()
      default:
        return renderPersonalInformation()
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <StudentLayout title="Profile" description="View your personal information">
          <div className="min-h-screen">
            <div className="space-y-6 p-4">
              {/* Profile Header Skeleton */}
              <Card className="shadow-xl border-2 border-[#efefef] backdrop-blur-sm">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Information Skeleton */}
              <Card className="shadow-xl border-2 border-[#efefef] backdrop-blur-sm">
              <div className="p-4 sm:p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-6 w-40"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-32"></div>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    )
  }

  if (!studentData) {
    return (
      <ProtectedRoute>
        <StudentLayout title="Profile" description="View your personal information">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
              <p className="text-gray-600">Unable to load your profile information.</p>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <StudentLayout title="Profile" description="View and update your personal information">
        <div className="min-h-screen">
          <div className="space-y-6 p-4">
            {/* Profile Header */}
            <Card className="shadow-xl border-2 border-[#efefef] backdrop-blur-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="relative h-16 w-16">
                  
                  {/* Initials badge overlay - enlarged to fill the display */}
                  <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-bold border border-blue-700 shadow-sm uppercase leading-none">
                    {(studentData.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)) || 'ST'}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{studentData.name}</h2>
                  <p className="text-gray-600">{studentData.email}</p>
                  {studentData.status && (
                    <Badge 
                      variant={studentData.status === 'active' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {studentData.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Multi-Step Form */}
          <Card className="shadow-xl border-2 border-[#efefef] backdrop-blur-sm">
            {/* Breadcrumb Navigation */}
            <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-gray-50">
              <nav className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Profile</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-blue-600 font-medium">{FORM_STEPS[currentStep].title}</span>
              </nav>
            </div>

            {/* Step Navigation */}
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base sm:text-lg text-gray-900">Complete Your Profile</h3>
                <div className="flex flex-1 items-center justify-end space-x-3">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Step {currentStep + 1} of {FORM_STEPS.length}
                  </span>
                </div>
              </div>

              {/* Informative / Completion message */}
              <div className="mb-4">
                {profileCompleted ? (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
                    <Check className="h-4 w-4" />
                    <p className="text-sm text-green-700">
                      Your profile has been updated successfully.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                    <Info className="h-4 w-4" />
                    <p className="text-sm text-amber-700 flex-1">
                      Use the button here to edit your information.
                    </p>
                    {!isEditing ? (
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Information
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                        onClick={() => { setIsEditing(false); }}
                      >
                        Done
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Enhanced Progress Bar - Fixed responsive design */}
              <div className="w-full mb-6">
                {/* Mobile view - Grid layout instead of horizontal scroll */}
                <div className="block sm:hidden">
                  <div className="grid grid-cols-3 gap-2">
                    {FORM_STEPS.map((step, index) => {
                      const Icon = step.icon
                      const isActive = index === currentStep
                      const isCompleted = index < currentStep
                      
                      return (
                        <div
                          key={step.id}
                          className={`flex flex-col items-center space-y-1 px-2 py-3 rounded-lg transition-all duration-200 border-2 ${
                            isActive 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                              : isCompleted 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium text-center leading-tight ${
                            isActive || isCompleted ? 'text-white' : 'text-gray-600'
                          }`}>
                            {step.title.split(' ')[0]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Desktop view - Full layout */}
                <div className="hidden sm:flex items-center justify-between space-x-1">
                  {FORM_STEPS.map((step, index) => {
                    const Icon = step.icon
                    const isActive = index === currentStep
                    const isCompleted = index < currentStep
                    
                    return (
                      <React.Fragment key={step.id}>
                        <div
                          onClick={() => {}} // Disabled navigation
                          className={`flex flex-col items-center space-y-2 px-4 py-3 rounded-xl transition-all duration-200 border-2 flex-1 max-w-[140px] cursor-not-allowed ${
                            isActive 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105' 
                              : isCompleted 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium text-center leading-tight ${
                            isActive || isCompleted ? 'text-white' : 'text-gray-600'
                          }`}>
                            {step.title}
                          </span>
                          {isCompleted && !isActive && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        {index < FORM_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 ${
                            index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {FORM_STEPS[currentStep].title}
                </h4>
                <p className="text-sm text-gray-600">
                  {currentStep === 0 && "Basic personal information and demographics"}
                  {currentStep === 1 && "Contact details and address information"}
                  {currentStep === 2 && "Professional and work-related information"}
                  {currentStep === 3 && "Educational background and course preferences"}
                  {currentStep === 4 && "Spiritual background and church affiliation"}
                </p>
              </div>

              {renderStepContent()}
               
               {/* Navigation Button at Bottom */}
               <div className="mt-8 pt-6 border-t border-gray-100">
                 <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <button
                       type="button"
                       onClick={handleBack}
                       disabled={currentStep === 0}
                       className={`px-4 py-2 rounded-md font-medium ${
                         currentStep === 0
                           ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                       }`}
                     >
                       <span className="inline-flex items-center gap-2">
                         <ChevronLeft className="h-4 w-4" />
                         Go Back
                       </span>
                     </button>
                     <div className="text-sm text-gray-500">
                       {Object.keys(validationErrors).length > 0 && (
                         <span className="text-red-500">
                           Please complete all required fields
                         </span>
                       )}
                     </div>
                   </div>
                   <button
                     onClick={handleNext}
                     disabled={isSubmitting}
                     className="px-6 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                   >
                     {currentStep === FORM_STEPS.length - 1 ? (
                       isSubmitting ? (
                         <span className="inline-flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin" />
                           Completing...
                         </span>
                       ) : (
                         'Complete Information'
                       )
                     ) : 'Next Step'}
                   </button>
                 </div>
               </div>
            </div>
          </Card>
          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Check className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Profile Completed</h2>
                </div>
                <p className="text-sm text-gray-700">
                  Your Registration is Verified. Your Matriculation Number
                  <span className="font-medium"> {studentData?.matriculationNumber || 'Not assigned'} </span>
                  will now display on your dashboard.
                </p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => { setShowSuccessModal(false); setIsSubmitting(false) }}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => router.push('/student/dashboard')}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Go to dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  )
}