'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, UploadCloud, ChevronRight, FileText, Link as LinkIcon, Youtube, FileAudio, FileDigit, PencilLine, X } from 'lucide-react'

type ContentType = 'youtube' | 'audio' | 'pdf' | 'link' | 'text'


interface Course {
  id: string
  courseCode: string
  courseName: string
}

interface CourseContentItem {
  id: string
  courseId: string
  subjectId?: string | null
  subjectLabel?: string | null
  title: string
  contentType: ContentType
  url?: string | null
  description?: string | null
  additionalInfo?: string | null
  orderIndex: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface UploadCourseContentModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course | null
  onUploaded?: (item?: CourseContentItem) => void
  initialItem?: CourseContentItem | null
}

export default function UploadCourseContentModal({ isOpen, onClose, course, onUploaded, initialItem = null }: UploadCourseContentModalProps) {
  const [items, setItems] = useState<CourseContentItem[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [subjectLabel, setSubjectLabel] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [contentType, setContentType] = useState<ContentType>('youtube')
  const [url, setUrl] = useState<string>('')
  const [pdfUploadMode, setPdfUploadMode] = useState<'link' | 'file'>('link')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [bodyText, setBodyText] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [orderIndex, setOrderIndex] = useState<string>('')
  const [isPublished, setIsPublished] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<CourseContentItem | null>(null)

  useEffect(() => {
    if (!isOpen || !course) return

    const loadItems = async () => {
      try {
        setErrorMsg(null)
        const res = await fetch(`/api/admin/courses/${course.id}/contents`, { cache: 'no-store', credentials: 'include' })
        if (!res.ok) throw new Error(`Failed to fetch contents: ${res.status}`)
        const data = await res.json()
        setItems(Array.isArray(data?.items) ? data.items : [])
      } catch (e: any) {
        console.error('Error loading course contents', e)
        setErrorMsg(e?.message || 'Unable to load course content')
      } finally {
        // No UI loading indicator needed here since we removed inline listing
      }
    }
    loadItems()
  }, [isOpen, course?.id])

  // Prefill state when an initial item is provided for editing
  useEffect(() => {
    if (isOpen && initialItem) {
      setEditingItem(initialItem)
      setSubjectLabel(initialItem.subjectLabel || '')
      setTitle(initialItem.title || '')
      setContentType(initialItem.contentType)
      setUrl(initialItem.url || '')
      setPdfUploadMode('link')
      setPdfFile(null)
      setBodyText(initialItem.additionalInfo || '')
      setDescription(initialItem.description || '')
      setOrderIndex(String(typeof initialItem.orderIndex === 'number' ? initialItem.orderIndex : ''))
      setIsPublished(Boolean(initialItem.isPublished))
    }
  }, [isOpen, initialItem])

  const resetForm = () => {
    setSubjectLabel('')
    setTitle('')
    setContentType('youtube')
    setUrl('')
    setPdfUploadMode('link')
    setPdfFile(null)
    setBodyText('')
    setDescription('')
    setOrderIndex('')
    setIsPublished(true)
    setEditingItem(null)
  }

  // Inline edit/delete listing removed from this modal for a cleaner upload-only experience

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

  const grouped = useMemo(() => {
    const groups: Record<string, CourseContentItem[]> = {}
    items.forEach(item => {
      const key = item.subjectLabel?.trim() || 'General'
      groups[key] = groups[key] || []
      groups[key].push(item)
    })
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => {
        if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
    })
    return groups
  }, [items])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!course) return
    if (!title.trim()) {
      setErrorMsg('Title is required')
      return
    }
    // Validate based on content type and mode
    if (contentType === 'text') {
      if (!bodyText.trim()) {
        setErrorMsg('Body text is required for text content')
        return
      }
    } else if (contentType === 'pdf') {
      if (pdfUploadMode === 'link') {
        if (!url.trim()) {
          setErrorMsg('URL is required when linking a PDF')
          return
        }
      } else {
        if (!pdfFile) {
          setErrorMsg('Please choose a PDF file to upload')
          return
        }
        if (pdfFile && pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
          setErrorMsg('Invalid file type. Please select a PDF file.')
          return
        }
      }
    } else {
      if (!url.trim()) {
        setErrorMsg('URL is required for this content type')
        return
      }
    }
    try {
      setSubmitting(true)
      setErrorMsg(null)
      // Determine order index
      const sectionKey = (subjectLabel.trim() || 'General')
      const sameSection = items.filter(i => (i.subjectLabel?.trim() || 'General') === sectionKey)
      const nextIndex = (sameSection.length ? Math.max(...sameSection.map(i => i.orderIndex || 0)) : 0) + 1
      const effectiveOrderIndex = orderIndex.trim() === ''
        ? (editingItem ? editingItem.orderIndex : nextIndex)
        : (isNaN(parseInt(orderIndex, 10)) ? 0 : parseInt(orderIndex, 10))
      // If PDF upload mode is file, upload the file first to get its URL
      let finalUrl = (contentType === 'text') ? undefined : url.trim()
      if (contentType === 'pdf' && pdfUploadMode === 'file' && pdfFile && course) {
        const fd = new FormData()
        fd.append('file', pdfFile)
        const uploadRes = await fetch(`/api/admin/courses/${course.id}/contents/upload`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to upload PDF file')
        }
        const uploadData = await uploadRes.json()
        finalUrl = uploadData?.fileUrl
        if (!finalUrl) throw new Error('Upload succeeded but no file URL returned')
      }

      const payload: any = {
        title: title.trim(),
        contentType,
        url: contentType === 'text' ? undefined : finalUrl,
        description: description.trim() || undefined,
        additionalInfo: contentType === 'text' ? bodyText.trim() : undefined,
        orderIndex: effectiveOrderIndex,
        isPublished,
        subjectLabel: subjectLabel.trim() || undefined,
      }
      const urlPath = editingItem
        ? `/api/admin/courses/${course.id}/contents/${editingItem.id}`
        : `/api/admin/courses/${course.id}/contents`
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(urlPath, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || (editingItem ? 'Failed to update content' : 'Failed to upload content'))
      }
      const data = await res.json()
      const created: CourseContentItem | undefined = editingItem ? data?.item : data?.item
      // refresh items
      const ref = await fetch(`/api/admin/courses/${course.id}/contents`, { cache: 'no-store', credentials: 'include' })
      if (ref.ok) {
        const dd = await ref.json()
        setItems(Array.isArray(dd?.items) ? dd.items : [])
      }
      resetForm()
      onUploaded?.(created)
    } catch (e: any) {
      setErrorMsg(e?.message || (editingItem ? 'Update failed' : 'Upload failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            {editingItem ? (
              <>
                <PencilLine className="h-5 w-5 text-emerald-700" />
                Edit Course Content
                
              </>
            ) : (
              <>
                <UploadCloud className="h-5 w-5 text-green-600" />
                Upload Course Content
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {course && (
          <div className="mb-3">
            <div className="text-lg font-apercu-medium text-gray-900">{course.courseName}</div>
            <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-800 border border-green-200">{course.courseCode}</Badge>
          </div>
        )}

        <div>
          <Card className="p-4 sm:p-5 bg-white">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Section label (optional)</Label>
                <Input placeholder="e.g., Week 1: Introduction" value={subjectLabel} onChange={e => setSubjectLabel(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Title</Label>
                <Input placeholder="Content title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Content Type</Label>
                <Select value={contentType} onValueChange={(v: ContentType) => setContentType(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contentType === 'text' ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Body Text</Label>
          <Textarea rows={6} placeholder="Write the content here" value={bodyText} onChange={e => setBodyText(e.target.value)} />
        </div>
      ) : (
        contentType === 'pdf' ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">PDF Source</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="pdfUploadMode"
                  value="file"
                  checked={pdfUploadMode === 'file'}
                  onChange={() => setPdfUploadMode('file')}
                />
                Upload file
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="pdfUploadMode"
                  value="link"
                  checked={pdfUploadMode === 'link'}
                  onChange={() => setPdfUploadMode('link')}
                />
                Link to file
              </label>
            </div>

            {pdfUploadMode === 'file' ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Select PDF</Label>
                <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                {pdfFile && (
                  <div className="text-xs text-gray-600">Selected: {pdfFile.name}</div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">PDF URL</Label>
                <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">URL</Label>
            <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        )
      )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Description (optional)</Label>
                <Textarea rows={3} placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Order Index</Label>
                  <Input type="number" min={0} placeholder="Auto" value={orderIndex} onChange={e => setOrderIndex(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Publish</Label>
                  <Select value={isPublished ? 'true' : 'false'} onValueChange={(v) => setIsPublished(v === 'true')}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Publish?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Published</SelectItem>
                      <SelectItem value="false">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={onClose}>Close</Button>
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span className="text-white">{editingItem ? 'Saving…' : 'Uploading…'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-white">{editingItem ? 'Save Changes' : 'Upload'}</span>
                      <ChevronRight className="h-4 w-4 text-white" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}