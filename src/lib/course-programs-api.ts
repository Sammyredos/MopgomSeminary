/**
 * Course Program Availability API Helper Functions
 */

export interface CourseProgram {
  id: string
  name: string
  enabled: boolean
}

/**
 * Get course program availability settings from the API
 */
export async function getCourseAvailabilitySettings(): Promise<CourseProgram[]> {
  try {
    // Get auth token from localStorage or cookies (using same method as other admin pages)
    const localStorageToken = localStorage.getItem('auth-token')
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
    const token = localStorageToken || cookieToken
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // Use public endpoint when unauthenticated so signup respects admin settings
    const endpoint = token ? '/api/admin/settings/course-programs' : '/api/course-programs'
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch course program settings')
    }

    return data.programs
  } catch (error) {
    console.error('Error fetching course program settings:', error)
    // Return default programs if API fails
    return [
      { id: 'general', name: 'General Certificate', enabled: true },
      { id: 'diploma', name: 'Diploma Certificate', enabled: true },
      { id: 'bachelor', name: "Bachelor's Degree", enabled: true },
      { id: 'master', name: "Master's Degree", enabled: true }
    ]
  }
}

/**
 * Update course program availability settings via the API
 */
export async function updateCourseAvailabilitySettings(programs: CourseProgram[]): Promise<void> {
  try {
    // Get auth token from localStorage or cookies (using same method as other admin pages)
    const localStorageToken = localStorage.getItem('auth-token')
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
    const token = localStorageToken || cookieToken
    
    console.log('Debug - GET Token retrieval:', {
      localStorageToken: localStorageToken ? 'present' : 'null',
      cookieToken: cookieToken ? 'present' : 'null',
      finalToken: token ? 'present' : 'null',
      allCookies: document.cookie
    })
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    console.log('Request headers being sent:', headers)
    
    const response = await fetch('/api/admin/settings/course-programs', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ programs }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update course program settings')
    }
  } catch (error) {
    console.error('Error updating course program settings:', error)
    throw error
  }
}

/**
 * Helper function to get cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}