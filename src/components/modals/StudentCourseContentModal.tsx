'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CourseContentCard from '@/components/ui/course-content-card'
import { ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'

type ContentType = 'youtube' | 'audio' | 'pdf' | 'link' | 'text'

interface Course {
  id: string
  courseCode: string
  courseName: string
}

interface CourseContentItem {
  id: string
  courseId: string
  subjectLabel?: string | null
  title: string
  contentType: ContentType
  url?: string | null
  description?: string | null
  orderIndex: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface StudentCourseContentModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course | null
}

export default function StudentCourseContentModal({ isOpen, onClose, course }: StudentCourseContentModalProps) {
  const router = useRouter()
  const [items, setItems] = useState<CourseContentItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isOpen || !course) return
    const loadItems = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)
        const res = await fetch(`/api/admin/courses/${course.id}/contents?published=true`, { cache: 'no-store', credentials: 'include' })
        if (!res.ok) throw new Error(`Failed to fetch contents: ${res.status}`)
        const data = await res.json()
        const list: CourseContentItem[] = Array.isArray(data?.items) ? data.items : []
        list.sort((a, b) => {
          const sa = (a.subjectLabel || 'General').localeCompare(b.subjectLabel || 'General')
          if (sa !== 0) return sa
          return (a.orderIndex || 0) - (b.orderIndex || 0)
        })
        setItems(list)
      } catch (e: any) {
        console.error('Error loading student course contents', e)
        setErrorMsg(e?.message || 'Unable to load course content')
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [isOpen, course?.id])

  const totalPages = Math.ceil(items.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageItems = useMemo(() => items.slice(startIndex, startIndex + itemsPerPage), [items, startIndex, itemsPerPage])

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [course?.id])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">

        {course && (
          <div className="mb-3">
            <div className="text-lg font-apercu-medium text-gray-900">{course.courseName}</div>
            <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-800 border border-green-200">{course.courseCode}</Badge>
          </div>
        )}

        <div className="space-y-4">
          <Card className="p-4 sm:p-5 bg-white">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading content…
              </div>
            ) : errorMsg ? (
              <p className="text-sm text-red-600">{errorMsg}</p>
            ) : items.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="text-sm text-gray-500">No content available</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pageItems.map(item => (
                  <CourseContentCard
                    key={item.id}
                    title={item.title}
                    subjectLabel={item.subjectLabel}
                    description={item.description}
                    contentType={item.contentType}
                    // Do not pass isPublished or url for students (we add our own Open action)
                  >
                    {item.url && item.contentType === 'pdf' ? (
                      <Button asChild size="sm" variant="outline" className="hover:bg-emerald-50">
                        <Link href={`/student/content/viewer?url=${encodeURIComponent(item.url!)}&title=${encodeURIComponent(item.title)}`} prefetch={false}>
                          Open Secure Viewer
                        </Link>
                      </Button>
                    ) : item.url ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="hover:bg-emerald-50"
                      >
                        <a href={item.url as string} target="_blank" rel="noopener noreferrer">Open</a>
                      </Button>
                    ) : null}
                  </CourseContentCard>
                ))}
              </div>
            )}
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}