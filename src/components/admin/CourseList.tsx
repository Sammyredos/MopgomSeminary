'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Clock } from 'lucide-react'
import { EmptyStates } from '@/components/ui/empty-state'
import { CourseCard } from '@/components/admin/CourseCard'
import { CourseListSkeleton } from '@/components/ui/skeleton-loader'
import EditCourseModal from '@/components/modals/EditCourseModal'
import UploadCourseContentModal from '@/components/modals/UploadCourseContentModal'
import { useToast } from '@/contexts/ToastContext'

interface Course {
  id: string
  courseCode: string
  courseName: string
  subjectArea: string
  instructor: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  maxStudents?: number
  currentEnrollment?: number
  sessions?: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
}

interface CourseListProps {
  programType: string
  programLabel: string
  searchTerm?: string
  statusFilter?: string
  onCreateCourse?: () => void
  onCourseUpdated?: (updatedCourse: any) => void
  refreshTrigger?: number // Add this to trigger refresh when new courses are created
}

export function CourseList({ 
  programType, 
  programLabel, 
  searchTerm = '', 
  statusFilter = 'all',
  onCreateCourse,
  onCourseUpdated,
  refreshTrigger = 0 // Add refreshTrigger with default value
}: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadCourse, setUploadCourse] = useState<Course | null>(null)
  const itemsPerPage = 10
  const { success } = useToast()

  // Fetch courses for this program type
  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      // Only set active when filtering specifically for active or inactive
      if (statusFilter === 'active') {
        params.set('active', 'true')
      } else if (statusFilter === 'inactive') {
        params.set('active', 'false')
      }
      // Include search only when present
      if (searchTerm) {
        params.set('search', searchTerm)
      }
      
      const response = await fetch(`/api/admin/courses?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Filter courses by program type based on subjectArea
      const filteredCourses = data.courses.filter((course: Course) => {
        const subjectArea = course.subjectArea?.toLowerCase() || ''
        
        switch (programType) {
          case 'general-certificate':
            return subjectArea === 'general certificate' ||
                   (subjectArea.includes('general') && subjectArea.includes('certificate') && !subjectArea.includes('diploma'))
          case 'diploma-certificate':
            return subjectArea === 'diploma certificate' ||
                   (subjectArea.includes('diploma') && subjectArea.includes('certificate'))
          case 'bachelors-degree':
            return subjectArea === "bachelor's degree" ||
                   subjectArea.includes('bachelor') || 
                   subjectArea.includes('undergraduate')
          case 'masters-degree':
            return subjectArea === "master's degree" ||
                   subjectArea.includes('master') || 
                   subjectArea.includes('graduate')
          default:
            return true
        }
      })
      
      setCourses(filteredCourses)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
    // Reset pagination when filters or program change
    setCurrentPage(1)
  }, [programType, searchTerm, statusFilter, refreshTrigger]) // Add refreshTrigger to dependency array

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setEditModalOpen(true)
  }

  const handleEditSuccess = (updatedCourse?: any) => {
    // Close modal and clear selection
    setEditModalOpen(false)
    setSelectedCourse(null)
    
    // Call the parent's onCourseUpdated callback if provided
    // The parent will handle refreshing via refreshTrigger
    if (updatedCourse && onCourseUpdated) {
      onCourseUpdated(updatedCourse)
    }
  }

  const handleEditClose = () => {
    setEditModalOpen(false)
    setSelectedCourse(null)
  }

  const handleRefresh = () => {
    fetchCourses()
  }

  const handleUploadContent = (course: Course) => {
    setUploadCourse(course)
    setUploadModalOpen(true)
  }

  const handleUploadClose = () => {
    setUploadModalOpen(false)
    setUploadCourse(null)
  }

  if (loading) {
    return <CourseListSkeleton count={10} />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading courses: {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <EmptyStates.NoCourses 
        programType={programLabel}
        action={onCreateCourse ? {
          label: "Create Course",
          onClick: onCreateCourse
        } : undefined}
      />
    )
  }

  const totalPages = Math.ceil(courses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCourses = courses.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-6">
      {/*
        Responsive grid tuned for tablet landscape (~1024px):
        - Keep 2 columns at lg (>=1024) to avoid cramped cards
        - Move to 3 columns at xl (>=1280) and 4 at 2xl
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {paginatedCourses.map((course) => (
          <CourseCard 
            key={course.id}
            course={course}
            programType={programType}
            programLabel={programLabel}
            onEdit={handleEditCourse}
            onRefresh={handleRefresh}
            onUploadContent={handleUploadContent}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <EditCourseModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        course={selectedCourse}
      />

      <UploadCourseContentModal
        isOpen={uploadModalOpen}
        onClose={handleUploadClose}
        course={uploadCourse ? { id: uploadCourse.id, courseCode: uploadCourse.courseCode, courseName: uploadCourse.courseName } : null}
        onUploaded={() => { success('Content added successfully'); fetchCourses() }}
      />
    </div>
  )
}