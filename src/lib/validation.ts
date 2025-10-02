export interface ValidationError {
  field: string
  message: string
}

export interface FormData {
  // Personal Information
  fullName: string
  dateOfBirth: string
  gender: string
  address: string
  branch: string
  phoneNumber: string
  emailAddress: string

  // Emergency Contact Information
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
}

export const validateStep1 = (data: Partial<FormData>, minimumAge: number = 13, skipAgeCheck: boolean = false): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.fullName?.trim()) {
    errors.push({ field: 'fullName', message: 'Full name is required' })
  } else if (data.fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' })
  }

  if (!data.dateOfBirth) {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' })
  } else {
    const birthDate = new Date(data.dateOfBirth)
    if (isNaN(birthDate.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Please enter a valid date' })
    } else if (!skipAgeCheck) {
      const age = calculateAge(data.dateOfBirth)
      if (age < minimumAge) {
        errors.push({ field: 'dateOfBirth', message: `You must be at least ${minimumAge} years old to register` })
      }
    }
  }

  if (!data.gender) {
    errors.push({ field: 'gender', message: 'Gender is required' })
  }

  if (!data.address?.trim()) {
    errors.push({ field: 'address', message: 'Address is required' })
  }

  // Branch validation - required field
  if (!data.branch?.trim()) {
    errors.push({ field: 'branch', message: 'Please select a church branch' })
  }

  if (!data.phoneNumber?.trim()) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' })
  }

  if (!data.emailAddress?.trim()) {
    errors.push({ field: 'emailAddress', message: 'Email address is required' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailAddress)) {
    errors.push({ field: 'emailAddress', message: 'Please enter a valid email address' })
  }

  return errors
}

export const validateStep2 = (data: Partial<FormData>): ValidationError[] => {
  const errors: ValidationError[] = []

  // Emergency contact information is required
  if (!data.emergencyContactName?.trim()) {
    errors.push({ field: 'emergencyContactName', message: 'Emergency contact name is required' })
  } else if (data.emergencyContactName.trim().length < 2) {
    errors.push({ field: 'emergencyContactName', message: 'Emergency contact name must be at least 2 characters' })
  }

  if (!data.emergencyContactRelationship?.trim()) {
    errors.push({ field: 'emergencyContactRelationship', message: 'Emergency contact relationship is required' })
  }

  if (!data.emergencyContactPhone?.trim()) {
    errors.push({ field: 'emergencyContactPhone', message: 'Emergency contact phone is required' })
  } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(data.emergencyContactPhone.replace(/\s/g, ''))) {
    errors.push({ field: 'emergencyContactPhone', message: 'Please enter a valid emergency contact phone number' })
  }

  return errors
}

export const validateAllSteps = (data: Partial<FormData>): ValidationError[] => {
  return [
    ...validateStep1(data),
    ...validateStep2(data)
  ]
}

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Check for duplicate registration
export const checkDuplicateRegistration = async (emailAddress: string, phoneNumber: string) => {
  try {
    const response = await fetch('/api/registrations/check-duplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailAddress: emailAddress.trim(),
        phoneNumber: phoneNumber.trim()
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to check for duplicate registration')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Duplicate check error:', error)
    throw error
  }
}
