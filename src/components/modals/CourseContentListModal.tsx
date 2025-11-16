'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, ChevronLeft, ChevronRight, FileText, PencilLine, Trash2 } from 'lucide-react'
import UploadCourseContentModal from '@/components/modals/UploadCourseContentModal'
import { useToast } from '@/contexts/ToastContext'
import CourseContentCard from '@/components/ui/course-content-card'
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

interface CourseContentListModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course | null
}

export default function CourseContentListModal({ isOpen, onClose, course }: CourseContentListModalProps) {
  const [items, setItems] = useState<CourseContentItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 5
  const { success, error } = useToast()
  const [editItem, setEditItem] = useState<CourseContentItem | null>(null)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)

  useEffect(() => {
    if (!isOpen || !course) return
    const loadItems = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)
        const res = await fetch(`/api/admin/courses/${course.id}/contents`, { cache: 'no-store', credentials: 'include' })
        if (!res.ok) throw new Error(`Failed to fetch contents: ${res.status}`)
        const data = await res.json()
        const list: CourseContentItem[] = Array.isArray(data?.items) ? data.items : []
        // Sort by subject, then orderIndex
        list.sort((a, b) => {
          const sa = (a.subjectLabel || 'General').localeCompare(b.subjectLabel || 'General')
          if (sa !== 0) return sa
          return (a.orderIndex || 0) - (b.orderIndex || 0)
        })
        setItems(list)
      } catch (e: any) {
        console.error('Error loading course contents', e)
        setErrorMsg(e?.message || 'Unable to load course content')
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [isOpen, course?.id])

  const totalPages = Math.ceil(items.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageItems = items.slice(startIndex, startIndex + itemsPerPage)

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  const refreshItems = async () => {
    if (!course) return
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/courses/${course.id}/contents`, { cache: 'no-store', credentials: 'include' })
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
      console.error('Error refreshing contents', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item: CourseContentItem) => {
    if (!course) return
    const ok = typeof window !== 'undefined' ? window.confirm('Delete this content item?') : true
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/contents/${item.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) {
        const dd = await res.json().catch(() => ({}))
        throw new Error(dd?.error || 'Failed to delete')
      }
      success('Content deleted')
      await refreshItems()
    } catch (e: any) {
      error(e?.message || 'Delete failed')
    }
  }

  const handleEdit = (item: CourseContentItem) => {
    setEditItem(item)
    setShowEditModal(true)
  }

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

          <Card className="p-4 sm:p-5 bg-white">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading content…
              </div>
            ) : errorMsg ? (
              <p className="text-sm text-red-600">{errorMsg}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-600">No content found.</p>
            ) : (
              <div className="space-y-4">
                <div className="md:hidden space-y-3 -mx-1 sm:mx-0">
                  {pageItems.map(item => (
                    <div key={item.id} className="space-y-2">
                      <CourseContentListItem
                        id={item.id}
                        title={item.title}
                        subjectLabel={item.subjectLabel}
                        contentType={item.contentType}
                        description={item.description}
                        url={item.url}
                        showDescription={false}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleEdit(item)}
                        >
                          <PencilLine className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block">
                  <div className="overflow-x-auto -mx-4 sm:-mx-5 md:mx-0">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-emerald-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Title</th>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Subject</th>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-apercu-bold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pageItems.map(item => (
                          <tr key={item.id} className="hover:bg-emerald-50/40">
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="text-sm font-apercu-medium text-gray-900 break-words">{item.title}</div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">{item.subjectLabel || 'General'}</Badge>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">{(item.contentType || '').charAt(0).toUpperCase() + (item.contentType || '').slice(1)}</Badge>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <Badge className={`${item.isPublished ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'} text-[11px]`}>{item.isPublished ? 'Published' : 'Draft'}</Badge>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {item.url ? (
                                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm">
                                    <a href={item.url as string} target="_blank" rel="noopener noreferrer">Open</a>
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-[11px] bg-gray-50 text-gray-600 border-gray-200">No link</Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleEdit(item)}
                                >
                                  <PencilLine className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(item)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              </div>
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
      {/* Nested Edit Modal */}
      {course && (
        <UploadCourseContentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          course={course}
          initialItem={editItem}
          onUploaded={() => { setShowEditModal(false); success('Content updated'); refreshItems() }}
        />
      )}
    </Dialog>
  )
}