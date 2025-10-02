'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, User, Home, Briefcase, GraduationCap, Heart, ChevronDown, Check } from 'lucide-react'
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
}

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Information', icon: User },
  { id: 'contact', title: 'Contact & Address', icon: Home },
  { id: 'professional', title: 'Professional Details', icon: Briefcase },
  { id: 'education', title: 'Education & Course', icon: GraduationCap },
  { id: 'spiritual', title: 'Spiritual Information', icon: Heart }
]

export default function StudentProfilePage() {
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
    courseDesired: ''
  })
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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
        if (!studentData?.courseDesired?.trim()) errors.courseDesired = 'Desired course is required'
        break
      case 4: // Spiritual Information
        if (studentData?.acceptedJesusChrist === undefined) errors.acceptedJesus = 'Please indicate if you have accepted Jesus Christ'
        if (!studentData?.churchAffiliation?.trim()) errors.churchName = 'Church affiliation is required'
        break
    }
    
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  const handleNext = async () => {
    // Validate current step
    const { isValid, errors } = validateStep(currentStep)
    setValidationErrors(errors)
    
    if (!isValid) {
      toast.error('Please fill in all required fields before proceeding')
      
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
    
    // Save current step data
    await saveProfile()
    
    // Move to next step or complete
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      setValidationErrors({}) // Clear errors when moving to next step
    } else {
      toast.success('Profile completed successfully!')
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
             className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
               validationErrors.placeOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
             }`}
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
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.origin ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
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
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.maritalStatus ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
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
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.spouseName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
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
             className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
               validationErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
             }`}
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
             className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
               validationErrors.officeAddress ? 'border-red-500 bg-red-50' : 'border-gray-300'
             }`}
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
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.occupation ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
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
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.employer ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
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
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.position ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
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
          Schools Attended
        </label>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((index) => {
            const school = studentData?.schoolsAttended?.[index - 1]
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ({index}) Name of Institution
                  </label>
                  <input
                    type="text"
                    value={school?.institutionName || ''}
                    onChange={(e) => {
                      const updatedSchools = [...(studentData?.schoolsAttended || [])]
                      if (!updatedSchools[index - 1]) {
                        updatedSchools[index - 1] = { institutionName: '', certificatesHeld: '' }
                      }
                      updatedSchools[index - 1].institutionName = e.target.value
                      handleInputChange('schoolsAttended', updatedSchools)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter institution name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Certificates Held
                  </label>
                  <input
                    type="text"
                    value={school?.certificatesHeld || ''}
                    onChange={(e) => {
                      const updatedSchools = [...(studentData?.schoolsAttended || [])]
                      if (!updatedSchools[index - 1]) {
                        updatedSchools[index - 1] = { institutionName: '', certificatesHeld: '' }
                      }
                      updatedSchools[index - 1].certificatesHeld = e.target.value
                      handleInputChange('schoolsAttended', updatedSchools)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter certificates obtained"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Course Desired - Single field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Desired <span className="text-red-500">*</span>
        </label>
        <input
          ref={setInputRef('courseDesired')}
          type="text"
          value={studentData?.courseDesired || ''}
          onChange={(e) => handleInputChange('courseDesired', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.courseDesired ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Enter the course you wish to pursue"
        />
        {validationErrors.courseDesired && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.courseDesired}</p>
        )}
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
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="acceptedJesus"
                value="yes"
                checked={studentData?.acceptedJesusChrist === true}
                onChange={(e) => handleInputChange('acceptedJesusChrist', true)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="acceptedJesus"
                value="no"
                checked={studentData?.acceptedJesusChrist === false}
                onChange={(e) => handleInputChange('acceptedJesusChrist', false)}
                className="mr-2"
              />
              No
            </label>
          </div>
          {validationErrors.acceptedJesus && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.acceptedJesus}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            When (if applicable)
          </label>
          <input
            type="text"
            value={studentData?.whenAcceptedJesus || ''}
            onChange={(e) => handleInputChange('whenAcceptedJesus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter when you accepted Jesus Christ"
          />
        </div>
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
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.churchName ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
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
      <ProtectedRoute allowedRoles={['Student']}>
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
      <ProtectedRoute allowedRoles={['Student']}>
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
    <ProtectedRoute allowedRoles={['Student']}>
      <StudentLayout title="Profile" description="View and update your personal information">
        <div className="min-h-screen">
          <div className="space-y-6 p-4">
            {/* Profile Header */}
            <Card className="shadow-xl border-2 border-[#efefef] backdrop-blur-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={studentData.profilePicture} alt={studentData.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                    {studentData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
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
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Step {currentStep + 1} of {FORM_STEPS.length}
                  </span>
                </div>
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
                   <div className="text-sm text-gray-500">
                     {Object.keys(validationErrors).length > 0 && (
                       <span className="text-red-500">
                         Please complete all required fields
                       </span>
                     )}
                   </div>
                   <button
                     onClick={handleNext}
                     disabled={saving}
                     className={`px-6 py-2 rounded-md font-medium transition-colors ${
                       saving
                         ? 'bg-gray-400 text-white cursor-not-allowed'
                         : 'bg-blue-600 text-white hover:bg-blue-700'
                     }`}
                   >
                     {saving ? (
                       <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-white">Saving...</span>
                       </div>
                     ) : currentStep === FORM_STEPS.length - 1 ? (
                       'Complete Profile'
                     ) : (
                       'Next Step'
                     )}
                   </button>
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