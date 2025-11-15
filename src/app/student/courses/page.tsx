'use client'

import React, { useEffect, useState } from 'react'
import { StudentLayout } from '@/components/student/StudentLayout'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen } from 'lucide-react'
import { CourseCard } from '@/components/student/CourseCard'
import StudentCourseContentModal from '@/components/modals/StudentCourseContentModal'
import { CourseListSkeleton } from '@/components/ui/skeleton-loader'

interface Course {
  id: string
  courseCode: string
  courseName: string
  subjectArea: string
  instructor: string
  description?: string
  isActive: boolean
  // Optional fields for enhanced card UI
  maxStudents?: number
  currentEnrollment?: number
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [programLabel, setProgramLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debounceTimer, setDebounceTimer] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [selectedCourseForContent, setSelectedCourseForContent] = useState<Course | null>(null)

  const fetchCourses = async (opts?: { search?: string }) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (opts?.search) params.set('search', opts.search)
      const res = await fetch(`/api/student/courses?${params.toString()}`, { cache: 'no-store', credentials: 'include' })
      if (!res.ok) {
        throw new Error(`Failed to fetch courses: ${res.status}`)
      }
      const data = await res.json()
      setCourses(Array.isArray(data?.courses) ? data.courses : [])
      setProgramLabel(data?.programLabel || null)
    } catch (err: any) {
      console.error('Error loading student courses:', err)
      setError('Unable to load courses for your program.')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced search
  const onSearchChange = (val: string) => {
    setSearchTerm(val)
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(() => fetchCourses({ search: val }), 400)
    setDebounceTimer(t)
    setCurrentPage(1)
  }

  return (
    <ProtectedRoute>
      <StudentLayout title="Course Programs" description="Browse courses available for your registered program">
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900">Course Programs</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Browse courses available for your registered program</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="text-sm text-gray-600">
                  Showing courses for {programLabel ? (
                    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">{programLabel}</Badge>
                  ) : (
                    <span className="ml-2">Unknown</span>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-96">
                  <Input
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search courses by name, instructor, or program"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Courses content inside inner content card, matching admin */}
              <div className="mt-6">
                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300">
                  {loading ? (
                    <CourseListSkeleton count={itemsPerPage} />
                  ) : error ? (
                    <p className="text-sm text-red-600">{error}</p>
                  ) : courses.length === 0 ? (
                    <p className="text-sm text-gray-600">No courses available for your program yet.</p>
                  ) : (
                    <>
                      {/*
                        Responsive grid tuned for tablet landscape (~1024px):
                        - Keep 2 columns at lg (>=1024) to prevent cramped layout
                        - Increase to 3 columns at xl (>=1280) and 4 at 2xl
                      */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {courses
                          .slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage)
                          .map((course) => (
                            <CourseCard
                              key={course.id}
                              id={course.id}
                              courseCode={course.courseCode}
                              courseName={course.courseName}
                              subjectArea={course.subjectArea}
                              instructor={course.instructor}
                              description={course.description}
                              isActive={course.isActive}
                              programLabel={programLabel || undefined}
                              maxStudents={course.maxStudents}
                              currentEnrollment={course.currentEnrollment}
                              onViewDetails={(id) => {
                                const courseObj = courses.find(c => c.id === id)
                                if (courseObj) {
                                  setSelectedCourseForContent({ id: courseObj.id, courseCode: courseObj.courseCode, courseName: courseObj.courseName, subjectArea: courseObj.subjectArea, instructor: courseObj.instructor, description: courseObj.description, isActive: courseObj.isActive, maxStudents: courseObj.maxStudents, currentEnrollment: courseObj.currentEnrollment })
                                  setContentModalOpen(true)
                                }
                              }}
                            />
                          ))}
                      </div>

                      {/* Pagination Controls */}
                      {Math.ceil(courses.length / itemsPerPage) > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-600">
                            Page {currentPage} of {Math.ceil(courses.length / itemsPerPage)}
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
                              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(courses.length / itemsPerPage), p + 1))}
                              disabled={currentPage === Math.ceil(courses.length / itemsPerPage)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
          </CardContent>
        </Card>
        {/* Student Course Content Modal */}
        <StudentCourseContentModal
          isOpen={contentModalOpen}
          onClose={() => setContentModalOpen(false)}
          course={selectedCourseForContent ? { id: selectedCourseForContent.id, courseCode: selectedCourseForContent.courseCode, courseName: selectedCourseForContent.courseName } : null}
        />
      </div>
      </StudentLayout>
    </ProtectedRoute>
  )
}