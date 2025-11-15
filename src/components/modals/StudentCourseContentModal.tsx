'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { CourseContentListItem } from '@/components/ui/course-content-list-item'

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
  const itemsPerPage = 5

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

  const typeLabel = (t: ContentType) => t.charAt(0).toUpperCase() + t.slice(1)

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [course?.id])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:w-auto sm:max-w-4xl max-h-[85vh] overflow-y-auto">

        {course && (
          <div className="mb-3">
            <div className="text-lg font-apercu-medium text-gray-900">{course.courseName}</div>
            <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-800 border border-green-200">{course.courseCode}</Badge>
          </div>
        )}

        <div className="space-y-4">
          <Card className="p-4 sm:p-4 bg-white">
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
              <div className="space-y-4">
                {/* Mobile list (stacked rows) */}
                <div className="md:hidden space-y-3 -mx-1 sm:mx-0">
                  {pageItems.map(item => (
                    <CourseContentListItem
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      subjectLabel={item.subjectLabel}
                      contentType={item.contentType}
                      description={item.description}
                      url={item.url}
                      showDescription={false}
                    />
                  ))}
                </div>

                {/* Desktop/Tablet table list */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto -mx-4 sm:-mx-5 md:mx-0">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-emerald-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Title</th>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Subject</th>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pageItems.map(item => (
                          <tr key={item.id} className="hover:bg-emerald-50/40">
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="text-sm font-apercu-medium text-gray-900">{item.title}</div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">{item.subjectLabel || 'General'}</Badge>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">{typeLabel(item.contentType)}</Badge>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {item.url ? (
                                item.contentType === 'pdf' ? (
                                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm">
                                    <Link href={`/student/content/viewer?url=${encodeURIComponent(item.url!)}&title=${encodeURIComponent(item.title)}&subject=${encodeURIComponent(item.subjectLabel || 'General')}`} prefetch={false}>
                                      Open
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm">
                                    <a href={item.url as string} target="_blank" rel="noopener noreferrer">Open</a>
                                  </Button>
                                )
                              ) : (
                                <Badge variant="outline" className="text-[11px] bg-gray-50 text-gray-600 border-gray-200">No link</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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