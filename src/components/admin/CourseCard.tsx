'use client'

import { useState, memo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/ToastContext'
import { parseApiError } from '@/lib/error-messages'
import {
  BookOpen,
  Users,
  Edit,
  Trash2,
  Clock,
  GraduationCap,
  Loader2
} from 'lucide-react'

interface Course {
  id: string
  courseCode: string
  courseName: string
  instructor: string
  duration: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  currentEnrollment?: number
  sessions?: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
}

interface CourseCardProps {
  course: Course
  onEdit: (course: Course) => void
  onRefresh: () => void
  canEditCourses?: boolean
}

const CourseCardComponent = function CourseCard({
  course,
  onEdit,
  onRefresh,
  canEditCourses = true
}: CourseCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { success, error } = useToast()

  const showToast = useCallback((title: string, type: 'success' | 'error') => {
    if (type === 'success') {
      success(title)
    } else {
      error(title)
    }
  }, [success, error])

  const handleDeleteCourse = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    try {
      setDeleting(true)
      setShowDeleteConfirm(false)

      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete course')
      }

      showToast('Course deleted successfully', 'success')
      onRefresh()
    } catch (error) {
      console.error('Error deleting course:', error)
      const errorMessage = parseApiError(error)
      showToast(errorMessage.description, 'error')
    } finally {
      setDeleting(false)
    }
  }, [course.id, showToast, onRefresh])

  const getStatusColor = () => {
    if (!course.isActive) return 'text-gray-600 bg-gray-100'
    return 'text-green-700 bg-green-50'
  }



  return (
    <>
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 bg-white">
        {/* Course Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-apercu-bold text-lg text-gray-900 truncate">{course.courseName}</h3>
              <p className="font-apercu-medium text-sm text-gray-600 truncate">{course.courseCode}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">

                <Badge className={`${getStatusColor()} border-0 font-apercu-medium text-xs`}>
                  {course.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {canEditCourses && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(course)}
                className="font-apercu-medium"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="font-apercu-medium text-red-600 hover:text-red-700"
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
            <p className="font-apercu-bold text-lg sm:text-xl text-gray-900">{course.duration}</p>
            <p className="font-apercu-medium text-xs text-gray-600">Weeks</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
            <p className="font-apercu-bold text-lg sm:text-xl text-gray-900">{course.currentEnrollment || 0}</p>
            <p className="font-apercu-medium text-xs text-gray-600">Enrolled</p>
          </div>
        </div>

        {/* Course Info */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <GraduationCap className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="font-apercu-medium text-sm text-gray-700">
              Instructor: {course.instructor}
            </span>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="font-apercu-regular text-sm text-gray-600">
              Open enrollment
            </span>
          </div>

          {course.sessions && course.sessions.length > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="font-apercu-regular text-sm text-gray-600">
                {course.sessions.length} session{course.sessions.length > 1 ? 's' : ''} scheduled
              </span>
            </div>
          )}

          {/* Course Description */}
          {course.description && (
            <div className="mt-3">
              <p className="font-apercu-regular text-sm text-gray-600 leading-relaxed">
                {course.description}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-apercu-bold text-lg text-gray-900 mb-2">
              Delete Course
            </h3>
            <p className="font-apercu-regular text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{course.courseName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="font-apercu-medium"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="font-apercu-medium"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const CourseCard = memo(CourseCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.course.id === nextProps.course.id &&
    prevProps.course.courseName === nextProps.course.courseName &&
    prevProps.course.isActive === nextProps.course.isActive &&
    prevProps.course.currentEnrollment === nextProps.course.currentEnrollment &&
    prevProps.canEditCourses === nextProps.canEditCourses
  )
})

CourseCard.displayName = 'CourseCard'