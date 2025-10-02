interface StudentData {
  name?: string
  email?: string
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
  schoolsAttended?: Array<{
    institutionName: string
    certificatesHeld: string
  }>
  courseDesired?: string
}

export interface RegistrationStep {
  id: string
  title: string
  completed: boolean
  requiredFields: string[]
  missingFields: string[]
}

export interface RegistrationCompletionStatus {
  isComplete: boolean
  completedSteps: number
  totalSteps: number
  completionPercentage: number
  steps: RegistrationStep[]
  missingFieldsCount: number
}

export function checkRegistrationCompletion(studentData: StudentData): RegistrationCompletionStatus {
  const steps: RegistrationStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      completed: false,
      requiredFields: ['name', 'dateOfBirth', 'gender', 'placeOfBirth', 'origin', 'maritalStatus'],
      missingFields: []
    },
    {
      id: 'contact',
      title: 'Contact & Address',
      completed: false,
      requiredFields: ['email', 'phone', 'homeAddress', 'officePostalAddress'],
      missingFields: []
    },
    {
      id: 'professional',
      title: 'Professional Details',
      completed: false,
      requiredFields: ['presentOccupation', 'placeOfWork', 'positionHeldInOffice'],
      missingFields: []
    },
    {
      id: 'education',
      title: 'Education & Course',
      completed: false,
      requiredFields: ['courseDesired'],
      missingFields: []
    },
    {
      id: 'spiritual',
      title: 'Spiritual Information',
      completed: false,
      requiredFields: ['acceptedJesusChrist', 'churchAffiliation'],
      missingFields: []
    }
  ]

  let completedSteps = 0
  let totalMissingFields = 0

  steps.forEach(step => {
    const missingFields: string[] = []

    step.requiredFields.forEach(field => {
      const value = studentData[field as keyof StudentData]
      
      // Special handling for different field types
      if (field === 'acceptedJesusChrist') {
        if (value === undefined || value === null) {
          missingFields.push(field)
        }
      } else if (typeof value === 'string') {
        if (!value || !value.trim()) {
          missingFields.push(field)
        }
      } else if (value === undefined || value === null) {
        missingFields.push(field)
      }
    })

    // Special case for married status - spouse name is required if married
    if (step.id === 'personal' && studentData.maritalStatus === 'Married') {
      if (!studentData.spouseName || !studentData.spouseName.trim()) {
        missingFields.push('spouseName')
      }
    }

    step.missingFields = missingFields
    step.completed = missingFields.length === 0
    
    if (step.completed) {
      completedSteps++
    }
    
    totalMissingFields += missingFields.length
  })

  const totalSteps = steps.length
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100)
  const isComplete = completedSteps === totalSteps

  return {
    isComplete,
    completedSteps,
    totalSteps,
    completionPercentage,
    steps,
    missingFieldsCount: totalMissingFields
  }
}

export function getFieldDisplayName(fieldName: string): string {
  const fieldDisplayNames: Record<string, string> = {
    name: 'Full Name',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    placeOfBirth: 'Place of Birth',
    origin: 'Origin',
    maritalStatus: 'Marital Status',
    spouseName: 'Spouse Name',
    email: 'Email Address',
    phone: 'Phone Number',
    homeAddress: 'Home Address',
    officePostalAddress: 'Office/Postal Address',
    presentOccupation: 'Current Occupation',
    placeOfWork: 'Place of Work',
    positionHeldInOffice: 'Position Held',
    courseDesired: 'Desired Course',
    acceptedJesusChrist: 'Accepted Jesus Christ',
    churchAffiliation: 'Church Affiliation'
  }
  
  return fieldDisplayNames[fieldName] || fieldName
}