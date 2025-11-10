'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UploadCourseContentModal from '@/components/modals/UploadCourseContentModal'
import { useToast } from '@/contexts/ToastContext'

interface Course {
  id: string
  courseCode: string
  courseName: string
  subjectArea?: string
  instructor?: string
  isActive?: boolean
}

export default function AdminCourseUploadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const courseId = params?.id as string
  const { success, error } = useToast()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [openModal, setOpenModal] = useState<boolean>(false)

  const fetchCourse = useCallback(async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/courses/${courseId}`, { cache: 'no-store', credentials: 'include' })
      if (!res.ok) {
        throw new Error(`Failed to fetch course: ${res.status}`)
      }
      const data = await res.json()
      const c = data?.course as Course | undefined
      if (c && c.id) {
        setCourse({ id: c.id, courseCode: c.courseCode, courseName: c.courseName, subjectArea: c.subjectArea, instructor: c.instructor, isActive: c.isActive })
      } else {
        // Fallback minimal course if API shape changes
        setCourse({ id: courseId, courseCode: 'N/A', courseName: 'Course' })
      }
    } catch (e: any) {
      console.error('Error loading course for upload:', e)
      error('Unable to load course details')
      // Provide minimal fallback so upload can proceed
      setCourse({ id: courseId, courseCode: 'N/A', courseName: 'Course' })
    } finally {
      setLoading(false)
    }
  }, [courseId, error])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  const handleOpenModal = useCallback(() => {
    setOpenModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setOpenModal(false)
  }, [])

  const handleUploaded = useCallback(() => {
    success('Content saved successfully')
    // Optionally refresh course details or navigate back
    fetchCourse()
  }, [success, fetchCourse])

  return (
    <ProtectedRoute requiredRoles={['Super Admin', 'Admin', 'Manager', 'Lecturer']}> 
      <AdminLayoutNew title="Upload Course Content" description="Add and manage content for this course">
        <div className="px-6 py-8 space-y-6">
          <Card className="p-6">
            {loading ? (
              <div className="text-sm text-gray-600">Loading course details...</div>
            ) : course ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="font-apercu-bold text-lg text-gray-900">{course.courseName}</h2>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-apercu-medium text-xs px-2 py-1 uppercase">
                      {course.courseCode}
                    </Badge>
                    {course.isActive !== undefined && (
                      <Badge className={`${course.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} font-apercu-medium text-xs px-2 py-1`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                    {course.subjectArea && (
                      <Badge variant="outline" className="text-xs capitalize">{course.subjectArea}</Badge>
                    )}
                    {course.instructor && (
                      <Badge variant="outline" className="text-xs">Instructor: {course.instructor}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleOpenModal}>
                    Upload Course Content
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/admin/courses')}>Back to Courses</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-600">Course not found.</div>
            )}
          </Card>

          <UploadCourseContentModal
            isOpen={openModal}
            onClose={handleCloseModal}
            course={course ? { id: course.id, courseCode: course.courseCode, courseName: course.courseName } : null}
            onUploaded={handleUploaded}
          />
        </div>
      </AdminLayoutNew>
    </ProtectedRoute>
  )
}