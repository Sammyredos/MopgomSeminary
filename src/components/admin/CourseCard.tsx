'use client'

import { useState, memo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/ToastContext'
import { parseApiError } from '@/lib/error-messages'
import {
  Users,
  Edit,
  Trash2,
  Clock,
  GraduationCap,
  Loader2,
  ChevronRight,
  Eye
} from 'lucide-react'
import CourseContentListModal from '@/components/modals/CourseContentListModal'


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

interface CourseCardProps {
  course: Course
  onEdit: (course: Course) => void
  onRefresh: () => void
  canEditCourses?: boolean
  programType?: string
  programLabel?: string
  onUploadContent?: (course: Course) => void
}

// Program-specific styling helper removed; using simplified static header styling

const CourseCardComponent = function CourseCard({
  course,
  onEdit,
  onRefresh,
  canEditCourses = true,
  programType,
  programLabel,
  onUploadContent
}: CourseCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showContentList, setShowContentList] = useState(false)

  const { success, error } = useToast()

  const showToast = useCallback((title: string, type: 'success' | 'error') => {
    if (type === 'success') {
      success(title)
    } else {
      error(title)
    }
  }, [success, error])

  const handleDeleteCourse = useCallback(async () => {
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



  return (
    <>
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 bg-white">
        {/* Course Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Title line */}
            <h3 className="font-apercu-bold text-base sm:text-md text-gray-900 truncate capitalize">{course.courseName}</h3>

            {/* Program line removed to mirror student card */}

            {/* Code + Status line */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-apercu-medium text-xs px-2 py-1 uppercase">
                {course.courseCode}
              </Badge>
              <Badge className={`${
                course.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
              } font-apercu-medium text-xs px-2 py-1`}>
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
                className="font-apercu-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 transition-colors duration-150"
                disabled={deleting}
                title="Edit Course"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteCourse}
                className="font-apercu-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors duration-150"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Course Description with Instructor */}
        <div className="mb-6 hidden">
          <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/70 shadow-sm space-y-4">
            {/* Description/instructor panel removed */}
            
            {/* Description Content */}
            {course.description ? (
              <div className="relative mb-4">
                <p className="font-apercu-regular text-sm text-gray-600/70 leading-relaxed break-words overflow-hidden lowercase capitalize">
                  {(() => {
                    // Validate and clean the description
                    const desc = course.description.trim();
                    
                    // Check if description contains only valid characters (letters, numbers, spaces, punctuation)
                    const isValidDescription = /^[a-zA-Z0-9\s.,!?;:()\-'"\/\n\r]+$/.test(desc);
                    
                    if (!isValidDescription || desc.length < 10) {
                      return "Course Description Needs To Be Updated With Proper Content.";
                    }
                    
                    // Truncate if too long with better handling
                    if (desc.length > 160) {
                      const truncated = desc.substring(0, 160);
                      const lastSpace = truncated.lastIndexOf(' ');
                      return (lastSpace > 130 ? truncated.substring(0, lastSpace) : truncated) + "...";
                    }
                    
                    return desc;
                  })()}
                </p>
                {/* Subtle gradient overlay for long text */}
                <div className="absolute bottom-0 right-0 w-8 h-6 bg-gradient-to-l from-gray-100/80 to-transparent"></div>
              </div>
            ) : (
              <p className="font-apercu-regular text-sm text-gray-400/60 italic mb-4 lowercase capitalize">
                No Description Available
              </p>
            )}

            {/* Instructor Information */}
            <div className="border-t border-gray-200/60 pt-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <h4 className="font-apercu-bold text-sm text-gray-800">Instructor:</h4>
                <span className="font-apercu-regular text-sm text-gray-600/70 lowercase capitalize">
                  {course.instructor}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mirrored student-style body */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {course.instructor && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />Instructor: {course.instructor}
              </Badge>
            )}
            {course.subjectArea && (
              <Badge variant="outline" className="text-xs capitalize">
                {course.subjectArea}
              </Badge>
            )}
            {course.sessions && course.sessions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />Next: {`${course.sessions[0].dayOfWeek} ${course.sessions[0].startTime}`}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-700">
            {typeof course.maxStudents === 'number' && typeof course.currentEnrollment === 'number' ? (
              <span className="inline-flex items-center">
                <Users className="h-4 w-4 mr-1 text-emerald-600" />
                {course.currentEnrollment}/{course.maxStudents} enrolled
                {(() => {
                  const remaining = Math.max((course.maxStudents || 0) - (course.currentEnrollment || 0), 0)
                  return ` · ${remaining} slots open`
                })()}
              </span>
            ) : (
              <p
                className="text-gray-700/80 text-sm leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {course.description ? course.description : 'No description provided.'}
              </p>
            )}
          </div>
        </div>
        {/* Course Sessions Info */}
        {course.sessions && course.sessions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="font-apercu-medium text-sm text-gray-700 lowercase capitalize">
                {course.sessions.length} Session{course.sessions.length !== 1 ? 's' : ''} Scheduled
              </span>
            </div>
          </div>
        )}
        {/* CTA: Upload Course Content */}
        <div className="pt-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="group bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
              onClick={() => {
                if (typeof onUploadContent === 'function') {
                  onUploadContent(course)
                } else {
                  // Fallback to navigation if handler not provided
                  window.location.assign(`/admin/courses/${course.id}/upload`)
                }
              }}
            >
              Upload Content
              <ChevronRight className="h-4 w-4 ml-1 text-white/90 group-hover:text-white" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="group border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setShowContentList(true)}
              title="View uploaded content"
            >
              <Eye className="h-4 w-4 mr-1" /> View Content
            </Button>
          </div>
        </div>
      </Card>

      {/* Content List Modal */}
      <CourseContentListModal
        isOpen={showContentList}
        onClose={() => setShowContentList(false)}
        course={{ id: course.id, courseCode: course.courseCode, courseName: course.courseName }}
      />

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