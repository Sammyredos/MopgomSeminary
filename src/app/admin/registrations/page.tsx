'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnhancedBadge, getStatusBadgeVariant } from '@/components/ui/enhanced-badge'
import { useToast } from '@/contexts/ToastContext'
import { capitalizeName } from '@/lib/utils'
import { ErrorModal } from '@/components/ui/error-modal'
import { parseApiError } from '@/lib/error-messages'
// Removed heavy animations for better performance
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Avatar } from '@/components/ui/avatar'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import { UserCard } from '@/components/ui/user-card'
import { useTranslation } from '@/contexts/LanguageContext'
import { clearStatisticsCache } from '@/lib/statistics'
import { ViewToggle } from '@/components/ui/view-toggle'
import { Pagination } from '@/components/ui/pagination'
import { BanConfirmModal } from '@/components/modals/BanConfirmModal'
import { UnbanConfirmModal } from '@/components/modals/UnbanConfirmModal'


import {
  Users,
  Search,
  Download,
  Calendar,
  Clock,
  RefreshCw,
  User,
  Shield,
  Briefcase,
  Heart,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  Loader2,
  Trash2,
  LogIn,
  Ban
} from 'lucide-react'

interface Registration {
  id: string
  // Fields from attachment form only
  // Split name parts for editing convenience
  surname?: string
  firstname?: string
  lastname?: string
  fullName: string
  dateOfBirth: string
  gender: string
  homeAddress: string
  officePostalAddress: string
  phoneNumber: string
  emailAddress: string
  maritalStatus: string
  spouseName: string
  placeOfBirth: string
  origin: string
  presentOccupation: string
  placeOfWork: string
  positionHeldInOffice: string
  acceptedJesusChrist: boolean
  whenAcceptedJesus: string
  churchAffiliation: string
  schoolsAttended: Array<{
    institutionName: string
    certificatesHeld: string
  }>
  courseDesired: string

  // System fields
  createdAt: string
  updatedAt: string
  matricNumber?: string
  // Admin-only verification fields (not shown in modal)
  isVerified?: boolean
  verifiedAt?: string
  verifiedBy?: string
  attendanceMarked?: boolean
  attendanceTime?: string
  // Student account status (optional, populated when requested)
  userIsActive?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminRegistrations() {
  const { t } = useTranslation()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10, // 10 registrations per page
    total: 0,
    pages: 0
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Get saved view mode from localStorage, default to 'list'
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('registrations-view-mode') as 'grid' | 'list') || 'list'
    }
    return 'list'
  })
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Registration | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [registrationToDelete, setRegistrationToDelete] = useState<Registration | null>(null)
  // Ban confirmation modal state
  const [showBanConfirm, setShowBanConfirm] = useState(false)
  const [banTarget, setBanTarget] = useState<Registration | null>(null)
  const [isBanning, setIsBanning] = useState(false)
  // Unban confirmation modal state
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false)
  const [unbanTarget, setUnbanTarget] = useState<Registration | null>(null)
  const [isUnbanning, setIsUnbanning] = useState(false)
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    type: 'error' | 'warning' | 'info' | 'success'
    title: string
    description: string
    details?: string
    errorCode?: string
  }>({
    isOpen: false,
    type: 'error',
    title: '',
    description: ''
  })

  const [analyticsData, setAnalyticsData] = useState({
    registrationsToday: 0,
    registrationsThisWeek: 0,
    registrationsThisMonth: 0,
    averageAge: 0
  })

  const { success, error } = useToast()

  
  // Adapt labels when rendered under /admin/students
  const isStudentsRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/admin/students') ||
    new URLSearchParams(window.location.search).get('tab') === 'students'
  )
  const pageTitle = isStudentsRoute ? 'Students' : t('page.registrations.title')
  const pageDescription = isStudentsRoute ? 'Manage student records and details' : t('page.registrations.description')
  const totalTitle = isStudentsRoute ? 'Total Students' : 'Total Registrations'
  const todaySubtitle = isStudentsRoute ? 'New today' : 'Registrations today'
  const weekSubtitle = isStudentsRoute ? 'New this week' : 'Weekly registrations'
  const loadingText = isStudentsRoute ? 'Loading students...' : 'Loading registrations...'
  const listCountLabel = isStudentsRoute ? 'students' : 'registrations'
  const emptyTitle = isStudentsRoute ? 'No Students Yet' : 'No Registrations Yet'
  const emptyHint = isStudentsRoute 
    ? 'Try adjusting your search or filter criteria to find students.'
    : 'Try adjusting your search or filter criteria to find registrations.'
  const noDataIntro = isStudentsRoute 
    ? 'When students are added, they will appear here.'
    : 'When youth register for your program, they will appear here.'

  // Students route filters
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [verifyFilter, setVerifyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const availableCourses = Array.from(new Set(registrations.map(r => r.courseDesired).filter(Boolean)))

  const fetchRegistrations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      // Fetch registrations and analytics data in parallel for speed
      // Add cache-busting timestamp to prevent stale data
      const timestamp = Date.now()
      // Build registrations query and always include student status for accuracy
      const regParams = new URLSearchParams({ limit: '50000', refresh: 'true', includeStudentStatus: 'true' })

      const [registrationsResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/registrations?${regParams.toString()}&_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`/api/admin/analytics?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
      ])

      if (registrationsResponse.ok) {
        const data = await registrationsResponse.json()
        // Data fetched successfully
        setRegistrations(data.registrations || [])
        // Update pagination info based on actual total count from API
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: Math.ceil((data.pagination?.total || 0) / prev.limit)
        }))
      }

      // Load analytics in background without blocking UI
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalyticsData({
          registrationsToday: analyticsData.registrationsToday || 0,
          registrationsThisWeek: analyticsData.registrationsThisWeek || 0,
          registrationsThisMonth: analyticsData.registrationsThisMonth || 0,
          averageAge: analyticsData.stats?.averageAge || 0
        })
      }
    } catch {
      // Show error toast for fetch failures
      error('Failed to Load Registrations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, []) // Remove error dependency to prevent infinite loop

  // Fetch registrations on component mount
  useEffect(() => {
    fetchRegistrations()
  }, []) // Remove fetchRegistrations dependency to prevent infinite loop

  // Default to grid view on Students tab
  useEffect(() => {
    if (isStudentsRoute && viewMode !== 'grid') {
      setViewMode('grid')
      if (typeof window !== 'undefined') {
        localStorage.setItem('registrations-view-mode', 'grid')
      }
    }
  }, [])

  // Reset to page 1 when search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchTerm])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Ban confirmation handlers
  const handleBanRequest = (registration: Registration) => {
    // Only allow ban when status is known and currently active
    if (registration.userIsActive !== true) return
    setBanTarget(registration)
    setShowBanConfirm(true)
  }

  const confirmBan = async () => {
    if (!banTarget) return
    try {
      setIsBanning(true)
      // Deactivate explicitly when confirming ban
      await handleToggleStudentActive(banTarget.emailAddress, true)
      setShowBanConfirm(false)
      setBanTarget(null)
    } finally {
      setIsBanning(false)
    }
  }

  const cancelBan = () => {
    setShowBanConfirm(false)
    setBanTarget(null)
  }

  // Unban confirmation handlers
  const handleUnbanRequest = (registration: Registration) => {
    // Only allow unban when status is known and currently inactive
    if (registration.userIsActive !== false) return
    setUnbanTarget(registration)
    setShowUnbanConfirm(true)
  }

  const confirmUnban = async () => {
    if (!unbanTarget) return
    try {
      setIsUnbanning(true)
      // Activate explicitly when confirming unban
      await handleToggleStudentActive(unbanTarget.emailAddress, false)
      setShowUnbanConfirm(false)
      setUnbanTarget(null)
    } finally {
      setIsUnbanning(false)
    }
  }

  const cancelUnban = () => {
    setShowUnbanConfirm(false)
    setUnbanTarget(null)
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }



  // Filter registrations based on search and students route filters
  const allFilteredRegistrations = registrations.filter(registration => {
    const matchesSearch = searchTerm === '' ||
      registration.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (registration.matricNumber && registration.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()))

    // Students route specific filters
    const matchesCourse = !isStudentsRoute || courseFilter === 'all' || registration.courseDesired === courseFilter
    const matchesGender = !isStudentsRoute || genderFilter === 'all' || registration.gender === genderFilter
    const matchesVerify = !isStudentsRoute || verifyFilter === 'all' || (verifyFilter === 'verified' ? !!registration.isVerified : !registration.isVerified)
    const matchesStatus = !isStudentsRoute || statusFilter === 'all' || (statusFilter === 'banned' ? registration.userIsActive === false : registration.userIsActive === true)

    return matchesSearch && matchesCourse && matchesGender && matchesVerify && matchesStatus
  })

  // Client-side pagination
  const startIndex = (pagination.page - 1) * pagination.limit
  const endIndex = startIndex + pagination.limit
  const filteredRegistrations = allFilteredRegistrations.slice(startIndex, endIndex)

  // Update pagination info based on filtered results
  const totalFilteredPages = Math.ceil(allFilteredRegistrations.length / pagination.limit)

  // Modal button handlers
  const handleExportPDF = async () => {
    if (!selectedRegistration) return

    setIsExporting(true)
    try {
      // Generate HTML content for PDF
      const htmlContent = generateHTMLContent(selectedRegistration)

      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        success('PDF Export Successful', 'PDF report opened in a new window. Use your browser\'s print function to save as PDF.')
      } else {
        // Fallback: download as HTML file
        const element = document.createElement('a')
        const file = new Blob([htmlContent], { type: 'text/html' })
        element.href = URL.createObjectURL(file)
        element.download = `registration-${selectedRegistration.fullName.replace(/\s+/g, '-').toLowerCase()}.html`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        success('PDF Export Successful', 'PDF export downloaded as HTML file. Open in browser and print to save as PDF.')
      }
    } catch (err) {
      // Show error modal
      setErrorModal({
        isOpen: true,
        type: 'error',
        title: 'PDF Export Failed',
        description: 'Unable to export the registration as PDF. This could be due to browser restrictions or a temporary issue.',
        details: `Error: ${err instanceof Error ? err.message : 'Unknown error'}\nRegistration: ${selectedRegistration?.fullName}\nTime: ${new Date().toISOString()}`,
        errorCode: 'PDF_EXPORT_ERROR'
      })
    } finally {
      setIsExporting(false)
    }
  }



  // Export all registrations as CSV
  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      // Create CSV content
      const csvContent = generateCSVContent(allFilteredRegistrations)

      // Create and download CSV file
      const element = document.createElement('a')
      const file = new Blob([csvContent], { type: 'text/csv' })
      element.href = URL.createObjectURL(file)
      element.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      success('CSV Export Successful')
    } catch (err) {
      setErrorModal({
        isOpen: true,
        type: 'error',
        title: 'CSV Export Failed',
        description: 'Unable to export registrations to CSV format. This could be due to browser restrictions or insufficient data.',
        details: `Error: ${err instanceof Error ? err.message : 'Unknown error'}\nTotal Records: ${allFilteredRegistrations.length}\nTime: ${new Date().toISOString()}`,
        errorCode: 'CSV_EXPORT_ERROR'
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Export all registrations as PDF
  const handleExportPDFAll = async () => {
    setIsExporting(true)
    try {
      // Generate comprehensive PDF content for all registrations
      const htmlContent = generateBulkPDFContent(allFilteredRegistrations)

      // Create and download PDF
      const element = document.createElement('a')
      const file = new Blob([htmlContent], { type: 'text/html' })
      element.href = URL.createObjectURL(file)
      element.download = `registrations-bulk-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      success('Bulk PDF Export Successful')
    } catch (err) {
      setErrorModal({
        isOpen: true,
        type: 'error',
        title: 'Bulk PDF Export Failed',
        description: 'Unable to generate the bulk PDF export file. This could be due to browser limitations or insufficient memory for large datasets.',
        details: `Error: ${err instanceof Error ? err.message : 'Unknown error'}\nTotal Records: ${allFilteredRegistrations.length}\nTime: ${new Date().toISOString()}`,
        errorCode: 'BULK_PDF_EXPORT_ERROR'
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Delete registration
  const handleDeleteRegistration = async (registration: Registration) => {
    setRegistrationToDelete(registration)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteRegistration = async () => {
    if (!registrationToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/registrations/${registrationToDelete.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        // Show success toast
        success('Registration Deleted Successfully')

        // Immediately remove from local state for instant UI update
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationToDelete.id))

        // Update pagination total immediately for real-time feedback
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
          pages: Math.ceil((prev.total - 1) / prev.limit)
        }))

        // Update analytics data immediately for real-time stats
        setAnalyticsData(prev => ({
          ...prev,
          // Note: We don't update today/week counts here as they need server calculation
          // They will be refreshed in the background fetch
        }))

        // Close modals
        setShowDeleteConfirm(false)
        setSelectedRegistration(null)
        setRegistrationToDelete(null)

        // Clear global stats cache to ensure all pages get updated stats
        clearStatisticsCache()

        // Refresh the registrations list and analytics in background to ensure consistency
        setTimeout(() => {
          fetchRegistrations()
        }, 500)
      } else {
        const errorData = await response.json()
        setErrorModal({
          isOpen: true,
          type: 'error',
          title: 'Delete Failed',
          description: 'Unable to delete the registration. This could be due to insufficient permissions or the registration being referenced by other data.',
          details: `Error: ${errorData.error}\nRegistration: ${registrationToDelete.fullName}\nID: ${registrationToDelete.id}\nTime: ${new Date().toISOString()}`,
          errorCode: `DELETE_${response.status}`
        })
      }
    } catch (err) {
      setErrorModal({
        isOpen: true,
        type: 'error',
        title: 'Delete Operation Failed',
        description: 'A network error occurred while trying to delete the registration. Please check your connection and try again.',
        details: `Error: ${err instanceof Error ? err.message : 'Unknown error'}\nRegistration: ${registrationToDelete?.fullName}\nTime: ${new Date().toISOString()}`,
        errorCode: 'DELETE_NETWORK_ERROR'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeleteRegistration = () => {
    setShowDeleteConfirm(false)
    setRegistrationToDelete(null)
  }

  // Impersonate student and open dashboard (new tab, popup-safe)
  const handleImpersonateStudent = async (email: string) => {
    // Open a blank tab immediately to avoid popup blockers
    const newTab = window.open('about:blank', '_blank')
    try {
      const res = await fetch('/api/admin/impersonate/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        error(data.error || 'Failed to login as student')
        // Close the placeholder tab if impersonation fails
        if (newTab && !newTab.closed) newTab.close()
        return
      }
      success('Logged in as student. Opening dashboard...')
      const url = data.redirectUrl || '/student/dashboard'
      if (newTab && !newTab.closed) {
        // Navigate the already-opened tab after cookie is set
        newTab.location.href = url
      } else {
        // Fallback if popup was blocked or closed
        window.open(url, '_blank')
      }
    } catch (e) {
      error('Network error while logging in as student')
      if (newTab && !newTab.closed) newTab.close()
    }
  }

  // Deactivate student by email
  const handleToggleStudentActive = async (email: string, isActive?: boolean) => {
    try {
      const endpoint = isActive ? '/api/admin/students/deactivate' : '/api/admin/students/activate'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        error(data.error || `Failed to ${isActive ? 'deactivate' : 'activate'} student`)
        return
      }
      success(data.message || (isActive ? 'Student marked as inactive' : 'Student activated'))

      // Update local state to reflect new status immediately
      const emailLower = (email || '').toLowerCase()
      setRegistrations(prev => prev.map(r => (
        r.emailAddress?.toLowerCase() === emailLower
          ? { ...r, userIsActive: !isActive }
          : r
      )))

      // Proactively re-fetch to ensure UI stays in sync with server
      await fetchRegistrations(true)
    } catch (e) {
      error(`Network error while ${isActive ? 'deactivating' : 'activating'} student`)
    }
  }
  const handleEditRegistration = async () => {
    if (!selectedRegistration) return

    // Prepare registration data for editing

    // Check if we have all the required fields, if not fetch fresh data
    const hasAllFields = selectedRegistration.homeAddress !== undefined &&
                        selectedRegistration.officePostalAddress !== undefined &&
                        selectedRegistration.maritalStatus !== undefined

    let registrationData = selectedRegistration

    if (!hasAllFields) {
      // Missing fields detected, fetching fresh registration data
      try {
        const response = await fetch(`/api/admin/registrations/${selectedRegistration.id}`)
        if (response.ok) {
          const result = await response.json()
          registrationData = result.registration
          // Fresh data fetched successfully
        }
      } catch (error) {
        console.error('Failed to fetch fresh registration data:', error)
      }
    }

    // Set the form data to the current registration with default values for missing fields
    const formData = {
      ...registrationData,
      // Ensure required fields have default values if they're null/undefined
      fullName: registrationData.fullName || '',
      // Prefill DOB for <input type="date"> as YYYY-MM-DD
      dateOfBirth: (() => {
        const raw = registrationData.dateOfBirth
        if (!raw) return ''
        const d = new Date(raw)
        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
      })(),
      gender: registrationData.gender || '',
      emailAddress: registrationData.emailAddress || '',
      phoneNumber: registrationData.phoneNumber || '',
      homeAddress: registrationData.homeAddress || '',
      officePostalAddress: registrationData.officePostalAddress || '',
      maritalStatus: registrationData.maritalStatus || '',
      spouseName: registrationData.spouseName || '',
      placeOfBirth: registrationData.placeOfBirth || '',
      origin: registrationData.origin || '',
      presentOccupation: registrationData.presentOccupation || '',
      placeOfWork: registrationData.placeOfWork || '',
      positionHeldInOffice: registrationData.positionHeldInOffice || '',
      acceptedJesusChrist: registrationData.acceptedJesusChrist || false,
      whenAcceptedJesus: registrationData.whenAcceptedJesus || '',
      churchAffiliation: registrationData.churchAffiliation || '',
      schoolsAttended: registrationData.schoolsAttended || [],
      courseDesired: registrationData.courseDesired || ''
    }

    // Ensure matric number is available even when loading fresh data (API returns matriculationNumber)
    // @ts-ignore
    formData.matricNumber = registrationData.matricNumber ?? registrationData.matriculationNumber ?? ''

    // Prefill split name parts from fullName
    const name = (formData.fullName || '').trim()
    const parts = name.split(/\s+/)
    const surname = parts[0] || ''
    const firstname = parts[1] || ''
    const lastname = parts.slice(2).join(' ') || ''

    formData.surname = surname
    formData.firstname = firstname
    formData.lastname = lastname

    // Set form data for editing
    setEditFormData(formData)
    setShowEditModal(true)
  }

  const handleCloseModal = () => {
    setSelectedRegistration(null)
    setIsExporting(false)
    setIsEditing(false)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditFormData(null)
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    if (!editFormData) return

    setIsEditing(true)
    try {
      // Prepare data for submission

      // Recompose fullName from name parts for API payload
      const { surname, firstname, lastname, ...rest } = editFormData
      const recomposedFullName = [surname, firstname, lastname].filter(Boolean).join(' ').trim()
      const payload: Record<string, any> = { ...rest, fullName: recomposedFullName || (editFormData.fullName || '').trim() }
      // Map UI matricNumber to API matriculationNumber when provided
      const matric = (editFormData.matricNumber || '').trim()
      if (matric) {
        payload.matriculationNumber = matric
      }

      const response = await fetch(`/api/admin/registrations/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Refresh the registrations list
        await fetchRegistrations()

        // Update the selected registration if it's the same one
        if (selectedRegistration?.id === editFormData.id) {
          setSelectedRegistration(editFormData)
        }

        // Close the edit modal
        handleCloseEditModal()

        // Show success toast
        success('Registration Updated')
      } else {
        const errorData = await response.json()
        setErrorModal({
          isOpen: true,
          type: 'error',
          title: 'Update Failed',
          description: 'Unable to save the registration changes. This could be due to validation errors or insufficient permissions.',
          details: `Error: ${errorData.error}\nRegistration: ${editFormData.fullName}\nID: ${editFormData.id}\nTime: ${new Date().toISOString()}`,
          errorCode: `UPDATE_${response.status}`
        })
      }
    } catch (err) {
      setErrorModal({
        isOpen: true,
        type: 'error',
        title: 'Update Operation Failed',
        description: 'A network error occurred while trying to save the registration changes. Please check your connection and try again.',
        details: `Error: ${err instanceof Error ? err.message : 'Unknown error'}\nRegistration: ${editFormData?.fullName}\nTime: ${new Date().toISOString()}`,
        errorCode: 'UPDATE_NETWORK_ERROR'
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleEditFormChange = (field: keyof Registration, value: string | boolean) => {
    if (!editFormData) return

    // If changing name parts, also recompute fullName
    if (field === 'surname' || field === 'firstname' || field === 'lastname') {
      const next = {
        ...editFormData,
        [field]: value as string
      }
      const nameParts = [next.surname || '', next.firstname || '', next.lastname || '']
      const fullName = nameParts.filter(Boolean).join(' ').trim()
      setEditFormData({
        ...next,
        fullName
      })
      return
    }

    setEditFormData({
      ...editFormData,
      [field]: value
    })
  }

  // Helper function to generate CSV content for bulk export
  const generateCSVContent = (registrations: Registration[]) => {
    const headers = [
      'Full Name',
      'Date of Birth',
      'Age',
      'Gender',
      'Email Address',
      'Phone Number',
      'Home Address',
      'Office/Postal Address',
      'Marital Status',
      'Spouse Name',
      'Place of Birth',
      'Origin',
      'Present Occupation',
      'Place of Work',
      'Position Held',
      'Accepted Jesus Christ',
      'When Accepted Jesus',
      'Church Affiliation',
      'Schools Attended',
      'Course Desired',
      'Registration Date',
      'Registration ID'
    ]

    const csvRows = [
      headers.join(','),
      ...registrations.map(reg => [
        `"${reg.fullName}"`,
        `"${formatDate(reg.dateOfBirth)}"`,
        calculateAge(reg.dateOfBirth),
        `"${reg.gender}"`,
        `"${reg.emailAddress}"`,
        `"${reg.phoneNumber}"`,
        `"${reg.homeAddress?.replace(/"/g, '""') || ''}"`,
        `"${reg.officePostalAddress?.replace(/"/g, '""') || ''}"`,
        `"${reg.maritalStatus || ''}"`,
        `"${reg.spouseName || ''}"`,
        `"${reg.placeOfBirth || ''}"`,
        `"${reg.origin || ''}"`,
        `"${reg.presentOccupation || ''}"`,
        `"${reg.placeOfWork || ''}"`,
        `"${reg.positionHeldInOffice || ''}"`,
        `"${reg.acceptedJesusChrist ? 'Yes' : 'No'}"`,
        `"${reg.whenAcceptedJesus || ''}"`,
        `"${reg.churchAffiliation || ''}"`,
        `"${reg.schoolsAttended?.map(school => `${school.institutionName} (${school.certificatesHeld})`).join('; ') || ''}"`,
        `"${reg.courseDesired || ''}"`,
        `"${formatDate(reg.createdAt)}"`,
        `"${reg.id}"`
      ].join(','))
    ]

    return csvRows.join('\n')
  }

  // Helper function to generate bulk PDF content for all registrations
  const generateBulkPDFContent = (registrations: Registration[]) => {
    const registrationCards = registrations.map(registration => `
      <div style="page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: bold;">Youth Program Registration</h2>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Registration ID: ${registration.id}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Personal Information</h3>
            <p><strong>Name:</strong> ${registration.fullName}</p>
            <p><strong>Date of Birth:</strong> ${formatDate(registration.dateOfBirth)}</p>
            <p><strong>Age:</strong> ${calculateAge(registration.dateOfBirth)} years</p>
            <p><strong>Gender:</strong> ${registration.gender}</p>
            <p><strong>Place of Birth:</strong> ${registration.placeOfBirth || 'Not provided'}</p>
            <p><strong>Origin:</strong> ${registration.origin || 'Not provided'}</p>
            <p><strong>Marital Status:</strong> ${registration.maritalStatus || 'Not provided'}</p>
            ${registration.spouseName ? `<p><strong>Spouse Name:</strong> ${registration.spouseName}</p>` : ''}
          </div>

          <div>
            <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Contact Information</h3>
            <p><strong>Email:</strong> ${registration.emailAddress}</p>
            <p><strong>Matric Number:</strong> </p>
            <p><strong>Phone:</strong> ${registration.phoneNumber}</p>
            <p><strong>Home Address:</strong> ${registration.homeAddress || 'Not provided'}</p>
            <p><strong>Office/Postal Address:</strong> ${registration.officePostalAddress || 'Not provided'}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Professional Information</h3>
            <p><strong>Present Occupation:</strong> ${registration.presentOccupation || 'Not provided'}</p>
            <p><strong>Place of Work:</strong> ${registration.placeOfWork || 'Not provided'}</p>
            <p><strong>Position Held:</strong> ${registration.positionHeldInOffice || 'Not provided'}</p>
          </div>

          <div>
            <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Spiritual Information</h3>
            <p><strong>Accepted Jesus Christ:</strong> ${registration.acceptedJesusChrist ? 'Yes' : 'No'}</p>
            ${registration.whenAcceptedJesus ? `<p><strong>When Accepted:</strong> ${registration.whenAcceptedJesus}</p>` : ''}
            <p><strong>Church Affiliation:</strong> ${registration.churchAffiliation || 'Not provided'}</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Educational Information</h3>
          ${registration.schoolsAttended && registration.schoolsAttended.length > 0 ? 
            registration.schoolsAttended.map(school => 
              `<p><strong>${school.institutionName}:</strong> ${school.certificatesHeld}</p>`
            ).join('') : 
            '<p>No schools listed</p>'
          }
          <p><strong>Course Desired:</strong> ${registration.courseDesired || 'Not specified'}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Registration Information</h3>
          <p><strong>Registration Date:</strong> ${formatDate(registration.createdAt)}</p>
        </div>
      </div>
    `).join('')

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Youth Program Registrations - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #6366f1; text-align: center; margin-bottom: 30px; }
        p { margin: 5px 0; }
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <h1>Youth Program Registrations Export</h1>
    <p style="text-align: center; color: #6b7280; margin-bottom: 40px;">
        Generated on ${new Date().toLocaleDateString()} | Total Registrations: ${registrations.length}
    </p>
    ${registrationCards}
</body>
</html>`
  }

  // Helper function to generate HTML content for PDF export
  const generateHTMLContent = (registration: Registration) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration - ${registration.fullName}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 30px;
            background: #fff;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: -30px -30px 40px -30px;
        }
        .title {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .subtitle {
            font-size: 16px;
            margin: 10px 0 5px 0;
            opacity: 0.9;
        }
        .section {
            margin: 30px 0;
            background: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid #4F46E5;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #4F46E5;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
        }
        .section-icon {
            width: 24px;
            height: 24px;
            margin-right: 10px;
            background: #4F46E5;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        .field-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 15px;
        }
        .field {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .field-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .field-value {
            color: #1f2937;
            font-size: 16px;
            word-wrap: break-word;
        }
        .full-width {
            grid-column: 1 / -1;
        }
        .badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
            font-size: 14px;
            color: #64748b;
        }
        @media print {
            body { margin: 0; padding: 20px; }
            .header { margin: -20px -20px 30px -20px; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Mopgom Theological Seminary Registration Certificate</h1>
            <p class="subtitle">Official Registration Document</p>
            <p class="subtitle">Participant: ${registration.fullName}</p>
            <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
        </div>

        <div class="section">
            <h2 class="section-title">
                <span class="section-icon">👤</span>
                Personal Information
            </h2>
            <div class="field-grid">
                <div class="field">
                    <div class="field-label">Full Name</div>
                    <div class="field-value">${registration.fullName}</div>
                </div>
                <div class="field">
                    <div class="field-label">Date of Birth</div>
                    <div class="field-value">${formatDate(registration.dateOfBirth)}</div>
                </div>
                <div class="field">
                    <div class="field-label">Age</div>
                    <div class="field-value">${calculateAge(registration.dateOfBirth)} years old</div>
                </div>
                <div class="field">
                    <div class="field-label">Gender</div>
                    <div class="field-value">${registration.gender}</div>
                </div>
                <div class="field">
                    <div class="field-label">Registration Date</div>
                    <div class="field-value">${formatDate(registration.createdAt)}</div>
                </div>
                <div class="field">
                    <div class="field-label">Status</div>
                    <div class="field-value"><span class="badge">Completed</span></div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">
                <span class="section-icon">📧</span>
                Contact Information
            </h2>
            <div class="field-grid">
                <div class="field">
                    <div class="field-label">Email Address</div>
                    <div class="field-value">${registration.emailAddress}</div>
                </div>
                <div class="field">
                    <div class="field-label">Phone Number</div>
                    <div class="field-value">${registration.phoneNumber}</div>
                </div>
                <div class="field full-width">
                    <div class="field-label">Home Address</div>
                    <div class="field-value">${registration.homeAddress || 'Not provided'}</div>
                </div>
                <div class="field full-width">
                    <div class="field-label">Office/Postal Address</div>
                    <div class="field-value">${registration.officePostalAddress || 'Not provided'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">
                <span class="section-icon">💼</span>
                Professional Information
            </h2>
            <div class="field-grid">
                <div class="field">
                    <div class="field-label">Present Occupation</div>
                    <div class="field-value">${registration.presentOccupation || 'Not provided'}</div>
                </div>
                <div class="field">
                    <div class="field-label">Place of Work</div>
                    <div class="field-value">${registration.placeOfWork || 'Not provided'}</div>
                </div>
                <div class="field">
                    <div class="field-label">Position Held</div>
                    <div class="field-value">${registration.positionHeldInOffice || 'Not provided'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">
                <span class="section-icon">✝️</span>
                Spiritual Information
            </h2>
            <div class="field-grid">
                <div class="field">
                    <div class="field-label">Accepted Jesus Christ</div>
                    <div class="field-value">${registration.acceptedJesusChrist ? 'Yes' : 'No'}</div>
                </div>
                ${registration.whenAcceptedJesus ? `
                <div class="field">
                    <div class="field-label">When Accepted Jesus</div>
                    <div class="field-value">${registration.whenAcceptedJesus}</div>
                </div>
                ` : ''}
                <div class="field">
                    <div class="field-label">Church Affiliation</div>
                    <div class="field-value">${registration.churchAffiliation || 'Not provided'}</div>
                </div>
            </div>
        </div>

        ${registration.schoolsAttended && registration.schoolsAttended.length > 0 ? `
        <div class="section">
            <h2 class="section-title">
                <span class="section-icon">🎓</span>
                Educational Information
            </h2>
            <div class="field-grid">
                ${registration.schoolsAttended.map(school => `
                <div class="field">
                    <div class="field-label">${school.institutionName}</div>
                    <div class="field-value">${school.certificatesHeld}</div>
                </div>
                `).join('')}
                <div class="field">
                    <div class="field-label">Course Desired</div>
                    <div class="field-value">${registration.courseDesired || 'Not specified'}</div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>School Management System</strong></p>
            <p>This document serves as official confirmation of registration.</p>
            <p>Document ID: REG-${registration.id.slice(-8).toUpperCase()} | Generated: ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`
  }

  // Show skeleton loader while data is loading
  if (loading) {
    // Detect saved view mode for skeleton loading
    const savedViewMode = typeof window !== 'undefined' 
      ? (localStorage.getItem('registrations-view-mode') as 'grid' | 'list') || 'list'
      : 'list'
    
    return (
      <AdminLayoutNew title={pageTitle} description={pageDescription}>
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 lg:p-6 bg-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-8 lg:h-10 lg:w-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0 ml-3" />
                </div>
              </Card>
            ))}
          </div>

          {/* Search and Filters Skeleton */}
          <Card className="p-4 lg:p-6 mb-6 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 lg:max-w-md">
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </Card>

          {/* View-aware skeleton loading */}
          {savedViewMode === 'list' ? (
            // Table/List View Skeleton
            <Card className="mb-6 lg:mb-8 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Gender</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Matric Number</th>
                      {isStudentsRoute ? (
                        <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Action</th>
                      ) : (
                        <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse mr-3" />
                            <div className="space-y-1">
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            // Grid View Skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {Array.from({ length: 15 }).map((_, i) => (
                <Card key={i} className="p-4 lg:p-6 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="mb-4">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-gray-200 rounded animate-pulse mr-2" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-gray-200 rounded animate-pulse mr-2" />
                        <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-gray-200 rounded animate-pulse mr-2" />
                        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-gray-200 rounded animate-pulse mr-2" />
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminLayoutNew>
    )
  }

  return (
    <AdminLayoutNew title={pageTitle} description={pageDescription}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="px-6">
          <StatsGrid columns={4}>
            <StatsCard
              title={totalTitle}
              value={pagination.total}
              subtitle="All participants registered"
              icon={Users}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
              bgGradient="bg-gradient-to-br from-white to-blue-50"
            />

            <StatsCard
              title="Today"
              value={analyticsData.registrationsToday}
              subtitle={todaySubtitle}
              icon={Calendar}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
              bgGradient="bg-gradient-to-br from-white to-green-50"
            />

            <StatsCard
              title="This Week"
              value={analyticsData.registrationsThisWeek}
              subtitle={weekSubtitle}
              icon={UserCheck}
              gradient="bg-gradient-to-r from-orange-500 to-amber-600"
              bgGradient="bg-gradient-to-br from-white to-orange-50"
            />

            <StatsCard
              title="Verified Users"
              value={registrations.filter(r => r.isVerified).length}
              subtitle="Verified participants"
              icon={UserCheck}
              gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
              bgGradient="bg-gradient-to-br from-white to-purple-50"
            />
          </StatsGrid>
        </div>

      {/* Search and Filters */}
      <div className="px-6">
        <Card className="p-4 lg:p-6 my-6 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or matric number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 lg:py-2 border border-gray-300 rounded-lg font-apercu-regular focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base"
              />
            </div>
          </div>

          {isStudentsRoute && (
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm lg:text-base font-apercu-regular focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Courses</option>
                {availableCourses.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm lg:text-base font-apercu-regular focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select value={verifyFilter} onChange={(e) => setVerifyFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm lg:text-base font-apercu-regular focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm lg:text-base font-apercu-regular focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All (Ban/Unban)</option>
                <option value="unbanned">Unbanned</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {!isStudentsRoute && (
              <Button
                variant="outline"
                className="font-apercu-medium text-sm lg:text-base"
                onClick={handleExportCSV}
                disabled={isExporting || allFilteredRegistrations.length === 0}
                size="sm"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                <span className="sm:hidden">{isExporting ? 'Exporting...' : 'CSV'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="font-apercu-regular text-sm text-gray-600">
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {loadingText}
                </span>
              ) : (
                <>
                  Showing {allFilteredRegistrations.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, allFilteredRegistrations.length)} of {allFilteredRegistrations.length} {listCountLabel}
                  {searchTerm && (
                    <span className="ml-2">
                      • Filtered by: <span className="font-apercu-medium">&quot;{searchTerm}&quot;</span>
                    </span>
                  )}
                </>
              )}
            </p>
            <div className="flex items-center">
              <ViewToggle 
                viewMode={viewMode} 
                onViewChange={(mode) => {
                  setViewMode(mode)
                  // Save view mode to localStorage for persistence
                  localStorage.setItem('registrations-view-mode', mode)
                }} 
              />
            </div>
            {refreshing && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="font-apercu-regular">Refreshing...</span>
              </div>
            )}
          </div>
        </div>
      </Card>
        </div>

      {/* Registrations Display - Conditional Grid/List View */}
      <div className="px-6">
        {filteredRegistrations.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {filteredRegistrations.map((registration) => (
                <UserCard
                  key={registration.id}
                  user={{
                    id: registration.id,
                    fullName: registration.fullName,
                    emailAddress: registration.emailAddress,
                    phoneNumber: registration.phoneNumber,
                    gender: registration.gender,
                    courseDesired: registration.courseDesired,
                    dateOfBirth: registration.dateOfBirth,
                    createdAt: registration.createdAt,
                    matricNumber: registration.matricNumber,
                    isVerified: registration.isVerified || false,
                    verifiedAt: registration.verifiedAt,
                    verifiedBy: registration.verifiedBy
                  }}
                  showGender={!isStudentsRoute}
                  onView={!isStudentsRoute ? () => setSelectedRegistration(registration) : undefined}
                  onDelete={() => handleDeleteRegistration(registration)}
                  showDeleteButton={!isStudentsRoute}
                  extraActions={
                    isStudentsRoute ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleImpersonateStudent(registration.emailAddress)}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Login
                        </Button>
                        {registration.userIsActive === true ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleBanRequest(registration)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban
                          </Button>
                        ) : registration.userIsActive === false ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleUnbanRequest(registration)}
                            aria-label="Unban student"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled
                            aria-label="Loading status"
                          >
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading
                          </Button>
                        )}
                      </div>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : (
            <Card className="mb-6 lg:mb-8 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Course</th>
                      {!isStudentsRoute && (
                        <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Gender</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Matric Number</th>
                      {isStudentsRoute ? (
                        <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Action</th>
                      ) : (
                        <th className="px-4 py-3 text-left text-xs font-apercu-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRegistrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-indigo-100 flex items-center justify-center rounded-full mr-3">
                              <span className="text-indigo-600 font-apercu-bold text-xs">
                                {getInitials(registration.fullName)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-apercu-medium text-gray-900">
                                {capitalizeName(registration.fullName)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 font-apercu-regular">{registration.emailAddress}</div>
                          <div className="text-sm text-gray-500 font-apercu-regular">{registration.phoneNumber}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-apercu-regular">
                          {registration.courseDesired || 'N/A'}
                        </td>
                        {!isStudentsRoute && (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-apercu-regular">
                            {registration.gender}
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <EnhancedBadge 
                            variant={getStatusBadgeVariant(registration.isVerified ? 'active' : 'pending')}
                            className="font-apercu-medium"
                          >
                            {registration.isVerified ? "Verified" : "Pending"}
                          </EnhancedBadge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-apercu-regular">
                          {registration.matricNumber || 'Not assigned'}
                        </td>
                        {isStudentsRoute ? (
                          <td className="px-4 py-4 text-sm font-apercu-medium">
                            <div className="flex flex-wrap gap-2">
                              {/* Login icon button */}
                              <Button
                                size="sm"
                                onClick={() => handleImpersonateStudent(registration.emailAddress)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                aria-label="Login as student"
                              >
                                <LogIn className="h-4 w-4" />
                              </Button>

                              {/* Ban or Activate icon button with distinctive color */}
                              {registration.userIsActive === true ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleBanRequest(registration)}
                                  className="text-white"
                                  aria-label="Ban student"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban
                                </Button>
                              ) : registration.userIsActive === false ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleUnbanRequest(registration)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  aria-label="Unban student"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Unban
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  aria-label="Loading status"
                                >
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading
                                </Button>
                              )}
                            </div>
                          </td>
                        ) : (
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-apercu-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRegistration(registration)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRegistration(registration)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        ) : (
          <Card className="p-12 text-center mb-8 bg-white">
            {(
              <>
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-apercu-bold text-lg text-gray-900 mb-2">
                  {pagination.total === 0 ? emptyTitle : isStudentsRoute ? 'No Matching Students' : 'No Matching Registrations'}
                </h3>
                <p className="font-apercu-regular text-gray-600 mb-4">
                  {pagination.total === 0
                    ? noDataIntro
                    : emptyHint
                  }
                </p>
                {pagination.total === 0 && (
                  <Button className="font-apercu-medium">
                    <FileText className="h-4 w-4 mr-2" />
                    View Registration Form
                  </Button>
                )}
              </>
            )}
          </Card>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6">
        {totalFilteredPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={totalFilteredPages}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            totalItems={allFilteredRegistrations.length}
            itemsPerPage={pagination.limit}
          />
        )}
      </div>

      {/* Registration Details Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-2 sm:p-4 lg:p-6">
          <div className="relative w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[98vh] sm:max-h-[95vh] lg:max-h-[90vh] bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-4 lg:my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 flex items-center justify-center flex-shrink-0 rounded-full">
                    <span className="text-white font-apercu-bold text-xs sm:text-sm">
                      {getInitials(selectedRegistration.fullName)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-apercu-bold text-lg sm:text-xl text-white truncate">
                      {capitalizeName(selectedRegistration.fullName)}
                    </h3>
                    <p className="font-apercu-regular text-indigo-100 text-xs sm:text-sm">
                      Registration Details
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 flex-shrink-0 ml-2"
                  disabled={isExporting || isEditing}
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="font-apercu-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-indigo-600" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Show split name parts instead of full name */}
                    {(() => {
                      const parts = (selectedRegistration.fullName || '').trim().split(/\s+/)
                      const surname = parts[0] || ''
                      const firstname = parts[1] || ''
                      const lastname = parts.slice(2).join(' ')
                      return (
                        <>
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Surname</label>
                            <p className="font-apercu-regular text-sm sm:text-base text-gray-900 break-words">{capitalizeName(surname)}</p>
                          </div>
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">First Name</label>
                            <p className="font-apercu-regular text-sm sm:text-base text-gray-900 break-words">{capitalizeName(firstname)}</p>
                          </div>
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Last Name</label>
                            <p className="font-apercu-regular text-sm sm:text-base text-gray-900 break-words">{capitalizeName(lastname)}</p>
                          </div>
                        </>
                      )
                    })()}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Date of Birth</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900">
                        {formatDate(selectedRegistration.dateOfBirth)} <span className="text-gray-600">(Age: {calculateAge(selectedRegistration.dateOfBirth)})</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Gender</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900">{selectedRegistration.gender}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Phone Number</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900">{selectedRegistration.phoneNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Email Address</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900 break-all">{selectedRegistration.emailAddress}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Place of Birth</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900">{selectedRegistration.placeOfBirth || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Origin</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900">{selectedRegistration.origin || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Marital Status</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900">{selectedRegistration.maritalStatus || 'Not provided'}</p>
                    </div>
                    {selectedRegistration.spouseName && (
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Spouse Name</label>
                        <p className="font-apercu-regular text-sm sm:text-base text-gray-900">{selectedRegistration.spouseName}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg lg:col-span-2">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Home Address</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900 break-words">{selectedRegistration.homeAddress || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg lg:col-span-2">
                      <label className="block font-apercu-medium text-xs sm:text-sm text-gray-600 mb-1">Office/Postal Address</label>
                      <p className="font-apercu-regular text-sm sm:text-base text-gray-900 break-words">{selectedRegistration.officePostalAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <label className="block font-apercu-medium text-sm text-green-700 mb-1">Present Occupation</label>
                      <p className="font-apercu-regular text-green-900">{selectedRegistration.presentOccupation || 'Not provided'}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <label className="block font-apercu-medium text-sm text-green-700 mb-1">Place of Work</label>
                      <p className="font-apercu-regular text-green-900">{selectedRegistration.placeOfWork || 'Not provided'}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 md:col-span-2">
                      <label className="block font-apercu-medium text-sm text-green-700 mb-1">Position Held in Office</label>
                      <p className="font-apercu-regular text-green-900">{selectedRegistration.positionHeldInOffice || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Spiritual Information */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-purple-600" />
                    Spiritual Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <label className="block font-apercu-medium text-sm text-purple-700 mb-1">Accepted Jesus Christ</label>
                      <p className="font-apercu-regular text-purple-900">{selectedRegistration.acceptedJesusChrist ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedRegistration.whenAcceptedJesus && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <label className="block font-apercu-medium text-sm text-purple-700 mb-1">When Accepted Jesus</label>
                        <p className="font-apercu-regular text-purple-900">{selectedRegistration.whenAcceptedJesus}</p>
                      </div>
                    )}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 md:col-span-2">
                      <label className="block font-apercu-medium text-sm text-purple-700 mb-1">Church Affiliation</label>
                      <p className="font-apercu-regular text-purple-900">{selectedRegistration.churchAffiliation || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Educational Information */}
                {selectedRegistration.schoolsAttended && selectedRegistration.schoolsAttended.length > 0 && (
                  <div>
                    <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                      Educational Information
                    </h4>
                    <div className="space-y-3">
                      {selectedRegistration.schoolsAttended.map((school, index) => (
                        <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-apercu-medium text-sm text-blue-700 mb-1">Institution Name</label>
                              <p className="font-apercu-regular text-blue-900">{school.institutionName}</p>
                            </div>
                            <div>
                              <label className="block font-apercu-medium text-sm text-blue-700 mb-1">Certificates Held</label>
                              <p className="font-apercu-regular text-blue-900">{school.certificatesHeld}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="block font-apercu-medium text-sm text-blue-700 mb-1">Course Desired</label>
                        <p className="font-apercu-regular text-blue-900">{selectedRegistration.courseDesired || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Registration Information */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                    Registration Information
                  </h4>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div>
                      <label className="block font-apercu-medium text-sm text-purple-700 mb-1">Matric Number</label>
                      <p className="font-apercu-regular text-purple-900">{selectedRegistration.matricNumber || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Information */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Verification Status
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block font-apercu-medium text-sm text-green-700 mb-1">Status</label>
                          <p className="font-apercu-regular text-green-900">
                            {selectedRegistration.isVerified ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Verification
                              </span>
                            )}
                          </p>
                        </div>
                        {selectedRegistration.isVerified && (
                          <div className="text-right">
                            <label className="block font-apercu-medium text-sm text-green-700 mb-1">Verified At</label>
                            <p className="font-apercu-regular text-green-900 text-xs">
                              {selectedRegistration.verifiedAt ? new Date(selectedRegistration.verifiedAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50">
                <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      variant="outline"
                      className="font-apercu-medium text-sm"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      size="sm"
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
                      <span className="sm:hidden">{isExporting ? 'Exporting...' : 'PDF'}</span>
                    </Button>

                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      variant="outline"
                      className="font-apercu-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-sm"
                      onClick={() => handleDeleteRegistration(selectedRegistration)}
                      disabled={isExporting || isEditing}
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Delete Registration</span>
                      <span className="sm:hidden">Delete</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCloseModal}
                      className="font-apercu-medium text-sm"
                      disabled={isExporting || isEditing}
                      size="sm"
                    >
                      Close
                    </Button>
                    <Button
                      className="font-apercu-medium text-sm"
                      onClick={handleEditRegistration}
                      disabled={isEditing}
                      size="sm"
                    >
                      {isEditing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      <span className="hidden sm:inline text-white">{isEditing ? 'Loading...' : 'Edit Registration'}</span>
                      <span className="sm:hidden text-white">{isEditing ? 'Loading...' : 'Edit'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Registration Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Edit Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-white/20 flex items-center justify-center rounded-full">
                    <span className="text-white font-apercu-bold text-sm">
                      {getInitials(editFormData.fullName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-apercu-bold text-xl text-white">
                      Edit Registration
                    </h3>
                    <p className="font-apercu-regular text-green-100 text-sm">
                      {capitalizeName(editFormData.fullName)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseEditModal}
                  className="text-white hover:bg-white/20"
                  disabled={isEditing}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Edit Modal Content */}
            <div className="max-h-[calc(90vh-180px)] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-green-600" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name Parts */}
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Surname
                      </label>
                      <Input
                        value={editFormData.surname || ''}
                        onChange={(e) => handleEditFormChange('surname', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter surname"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        First Name
                      </label>
                      <Input
                        value={editFormData.firstname || ''}
                        onChange={(e) => handleEditFormChange('firstname', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Last Name
                      </label>
                      <Input
                        value={editFormData.lastname || ''}
                        onChange={(e) => handleEditFormChange('lastname', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={editFormData.dateOfBirth || ''}
                        onChange={(e) => handleEditFormChange('dateOfBirth', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={editFormData.gender || 'Male'}
                        onChange={(e) => handleEditFormChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-apercu-regular focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isEditing}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <Input
                        value={editFormData.phoneNumber || ''}
                        onChange={(e) => handleEditFormChange('phoneNumber', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={editFormData.emailAddress || ''}
                        onChange={(e) => handleEditFormChange('emailAddress', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Matric Number
                      </label>
                      <Input
                        value={editFormData.matricNumber || ''}
                        onChange={(e) => handleEditFormChange('matricNumber', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter matric number"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Place of Birth
                      </label>
                      <Input
                        value={editFormData.placeOfBirth || ''}
                        onChange={(e) => handleEditFormChange('placeOfBirth', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter place of birth"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Origin
                      </label>
                      <Input
                        value={editFormData.origin || ''}
                        onChange={(e) => handleEditFormChange('origin', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter origin"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Marital Status
                      </label>
                      <select
                        value={editFormData.maritalStatus || ''}
                        onChange={(e) => handleEditFormChange('maritalStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-apercu-regular focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isEditing}
                      >
                        <option value="">Select Marital Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    {editFormData.maritalStatus === 'Married' && (
                      <div>
                        <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                          Spouse Name
                        </label>
                        <Input
                          value={editFormData.spouseName || ''}
                          onChange={(e) => handleEditFormChange('spouseName', e.target.value)}
                          className="font-apercu-regular"
                          disabled={isEditing}
                          placeholder="Enter spouse name"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Home Address
                      </label>
                      <Input
                        value={editFormData.homeAddress || ''}
                        onChange={(e) => handleEditFormChange('homeAddress', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter home address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Office/Postal Address
                      </label>
                      <Input
                        value={editFormData.officePostalAddress || ''}
                        onChange={(e) => handleEditFormChange('officePostalAddress', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter office/postal address"
                      />
                    </div>
                  </div>
                </div>



                {/* Professional Information Section */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Present Occupation
                      </label>
                      <Input
                        value={editFormData.presentOccupation || ''}
                        onChange={(e) => handleEditFormChange('presentOccupation', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter present occupation"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Place of Work
                      </label>
                      <Input
                        value={editFormData.placeOfWork || ''}
                        onChange={(e) => handleEditFormChange('placeOfWork', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter place of work"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Position Held in the Office
                      </label>
                      <Input
                        value={editFormData.positionHeldInOffice || ''}
                        onChange={(e) => handleEditFormChange('positionHeldInOffice', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter position held in office"
                      />
                    </div>
                  </div>
                </div>

                {/* Spiritual Information Section */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-purple-600" />
                    Spiritual Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Have you ever accepted Jesus Christ as your Lord and Saviour?
                      </label>
                      <select
                        value={editFormData.acceptedJesusChrist === true ? 'Yes' : editFormData.acceptedJesusChrist === false ? 'No' : ''}
                        onChange={(e) => handleEditFormChange('acceptedJesusChrist', e.target.value === 'Yes' ? true : false)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-apercu-regular focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isEditing}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {editFormData.acceptedJesusChrist === true && (
                      <div>
                        <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                          When?
                        </label>
                        <Input
                          value={editFormData.whenAcceptedJesus || ''}
                          onChange={(e) => handleEditFormChange('whenAcceptedJesus', e.target.value)}
                          className="font-apercu-regular"
                          disabled={isEditing}
                          placeholder="Enter when you accepted Jesus"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Church Affiliation
                      </label>
                      <Input
                        value={editFormData.churchAffiliation || ''}
                        onChange={(e) => handleEditFormChange('churchAffiliation', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter church affiliation"
                      />
                    </div>
                  </div>
                </div>

                {/* Educational Information Section */}
                <div>
                  <h4 className="font-apercu-bold text-lg text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                    Educational Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Schools Attended
                      </label>
                      <Input
                        value={Array.isArray(editFormData.schoolsAttended) ? editFormData.schoolsAttended.map(school => `${school.institutionName} - ${school.certificatesHeld}`).join('; ') : editFormData.schoolsAttended || ''}
                        onChange={(e) => handleEditFormChange('schoolsAttended', e.target.value)}
                        className="font-apercu-regular"
                        disabled={isEditing}
                        placeholder="Enter schools attended"
                      />
                    </div>
                    <div>
                      <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
                        Course Desired
                      </label>
                      <Select
                        value={editFormData.courseDesired || ''}
                        onValueChange={(val) => handleEditFormChange('courseDesired', val)}
                        disabled={isEditing}
                      >
                        <SelectTrigger className="font-apercu-regular">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Certificate">General Certificate</SelectItem>
                          <SelectItem value="Diploma Programme">Diploma Programme</SelectItem>
                          <SelectItem value="Advanced Diploma">Advanced Diploma</SelectItem>
                          <SelectItem value="Certificate in Theology">Certificate in Theology</SelectItem>
                          <SelectItem value="Pastoral Studies">Pastoral Studies</SelectItem>
                          <SelectItem value="Youth Ministry">Youth Ministry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Edit Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  <span className="font-apercu-medium">Registration ID:</span> {editFormData.id}
                </div>
                <div className="flex space-x-3 order-1 sm:order-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCloseEditModal}
                    className="font-apercu-medium flex-1 sm:flex-none"
                    disabled={isEditing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="font-apercu-medium bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                    disabled={isEditing}
                  >
                    {isEditing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {isEditing ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && registrationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Delete Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-apercu-bold text-xl text-white">
                    Delete Registration
                  </h3>
                  <p className="font-apercu-regular text-red-100 text-sm">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Delete Modal Content */}
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="font-apercu-bold text-lg text-gray-900 mb-2">
                  Are you sure you want to delete this registration?
                </h4>
                <p className="font-apercu-regular text-gray-600 mb-4">
                  You are about to permanently delete the registration for:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="font-apercu-bold text-gray-900">{capitalizeName(registrationToDelete.fullName)}</p>
                  <p className="font-apercu-regular text-sm text-gray-600">{registrationToDelete.emailAddress}</p>
                  <p className="font-apercu-regular text-sm text-gray-600">Registered on {formatDate(registrationToDelete.createdAt)}</p>
                </div>
                <p className="font-apercu-regular text-sm text-red-600">
                  This action cannot be undone. All registration data will be permanently removed.
                </p>
              </div>
            </div>

            {/* Delete Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteRegistration}
                  className="font-apercu-medium"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteRegistration}
                  className="font-apercu-medium bg-red-600 hover:bg-red-700 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete Registration'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {showBanConfirm && banTarget && (
        <BanConfirmModal
          isOpen={showBanConfirm}
          onClose={cancelBan}
          onConfirm={confirmBan}
          registration={{
            id: banTarget.id,
            fullName: banTarget.fullName,
            emailAddress: banTarget.emailAddress,
            createdAt: banTarget.createdAt
          }}
          loading={isBanning}
        />
      )}

      {/* Unban Confirmation Modal */}
      {showUnbanConfirm && unbanTarget && (
        <UnbanConfirmModal
          isOpen={showUnbanConfirm}
          onClose={cancelUnban}
          onConfirm={confirmUnban}
          registration={{
            id: unbanTarget.id,
            fullName: unbanTarget.fullName,
            emailAddress: unbanTarget.emailAddress,
            createdAt: unbanTarget.createdAt
          }}
          loading={isUnbanning}
        />
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        type={errorModal.type}
        title={errorModal.title}
        description={errorModal.description}
        details={errorModal.details}
        errorCode={errorModal.errorCode}
        showRetry={errorModal.type === 'error'}
        onRetry={() => {
          setErrorModal(prev => ({ ...prev, isOpen: false }))
        }}
        showContactSupport={errorModal.type === 'error'}
      />
      </div>
    </AdminLayoutNew>
  )
}


