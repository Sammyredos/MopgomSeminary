'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, ChevronLeft, ChevronRight, FileText, Link as LinkIcon, Youtube, FileAudio, FileDigit, PencilLine, Trash2 } from 'lucide-react'
import UploadCourseContentModal from '@/components/modals/UploadCourseContentModal'
import { useToast } from '@/contexts/ToastContext'
import CourseContentCard from '@/components/ui/course-content-card'

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
  const [search, setSearch] = useState<string>('')
  const itemsPerPage = 10
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(i =>
      (i.title || '').toLowerCase().includes(term) ||
      (i.description || '').toLowerCase().includes(term) ||
      (i.subjectLabel || 'General').toLowerCase().includes(term)
    )
  }, [items, search])

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const iconForType = (t: ContentType) => {
    switch (t) {
      case 'youtube': return Youtube
      case 'audio': return FileAudio
      case 'pdf': return FileDigit
      case 'link': return LinkIcon
      case 'text': return FileText
      default: return FileText
    }
  }

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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            Course Content
          </DialogTitle>
        </DialogHeader>

        {course && (
          <div className="mb-3">
            <div className="text-lg font-apercu-medium text-gray-900">{course.courseName}</div>
            <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-800 border border-green-200">{course.courseCode}</Badge>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</div>
            <div className="flex-1" />
            <div className="w-full sm:w-64">
              <Input placeholder="Search content…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <Card className="p-4 sm:p-5 bg-white">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading content…
              </div>
            ) : errorMsg ? (
              <p className="text-sm text-red-600">{errorMsg}</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-600">No content found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageItems.map(item => (
                  <CourseContentCard
                    key={item.id}
                    title={item.title}
                    subjectLabel={item.subjectLabel}
                    isPublished={item.isPublished}
                    description={item.description}
                    contentType={item.contentType}
                    url={item.url || undefined}
                  >
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