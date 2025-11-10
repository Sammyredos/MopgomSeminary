'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StudentLayout } from '@/components/student/StudentLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, PlayCircle, Music, FileText, Link as LinkIcon, File, ExternalLink } from 'lucide-react'

type ContentType = 'youtube' | 'audio' | 'pdf' | 'link' | 'text'

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

export default function StudentCourseContentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const courseId = params?.id as string

  const [items, setItems] = useState<CourseContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)
        const res = await fetch(`/api/admin/courses/${courseId}/contents?published=true`, { cache: 'no-store', credentials: 'include' })
        if (!res.ok) throw new Error(`Failed to fetch contents: ${res.status}`)
        const data = await res.json()
        const list: CourseContentItem[] = Array.isArray(data?.items) ? data.items : []
        setItems(list)
      } catch (e: any) {
        console.error('Error loading student content', e)
        setErrorMsg(e?.message || 'Unable to load course content')
      } finally {
        setLoading(false)
      }
    }
    if (courseId) load()
  }, [courseId])

  const sortedItems = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        // Sort by section label, then orderIndex, then createdAt
        const aLabel = (a.subjectLabel?.trim() || 'General').toLowerCase()
        const bLabel = (b.subjectLabel?.trim() || 'General').toLowerCase()
        if (aLabel !== bLabel) return aLabel.localeCompare(bLabel)
        if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
  }, [items])

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage)

  const iconFor = (type: ContentType) => {
    switch (type) {
      case 'youtube': return <PlayCircle className="h-4 w-4 text-red-600" />
      case 'audio': return <Music className="h-4 w-4 text-indigo-600" />
      case 'pdf': return <FileText className="h-4 w-4 text-amber-600" />
      case 'link': return <LinkIcon className="h-4 w-4 text-emerald-600" />
      case 'text': return <File className="h-4 w-4 text-gray-700" />
      default: return null
    }
  }

  return (
    <ProtectedRoute>
      <StudentLayout title="Course Content" description="Explore materials shared for this course">
        <div className="px-6 py-8 space-y-6">
          <Button variant="outline" onClick={() => router.push('/student/courses')} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Courses
          </Button>

          <Card className="p-4 sm:p-6 bg-white">
            {loading ? (
              <p className="text-sm text-gray-600">Loading content...</p>
            ) : errorMsg ? (
              <p className="text-sm text-red-600">{errorMsg}</p>
            ) : (
              <div className="space-y-6">
                {paginatedItems.length === 0 ? (
                  <p className="text-sm text-gray-600">No published content yet.</p>
                ) : (
                  <>
                    {/** Grid styling aligned with admin courses cards **/}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                      {paginatedItems.map((item) => (
                        <div key={item.id} className="group border border-gray-200 rounded-lg bg-white p-4 sm:p-5 hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center flex-shrink-0">
                              {iconFor(item.contentType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="font-apercu-medium text-sm text-gray-900 truncate break-words">
                                  {item.title}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] capitalize">{item.subjectLabel?.trim() || 'General'}</Badge>
                                <Badge variant="outline" className="text-[10px]">{item.isPublished ? 'Published' : 'Draft'}</Badge>
                              </div>
                              {item.description && (
                                <p
                                  className="mt-2 text-xs text-gray-600"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {item.description}
                                </p>
                              )}
                              {item.contentType === 'text' && item.additionalInfo && (
                                <p className="mt-2 text-sm text-gray-800" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {item.additionalInfo}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-end">
                            {item.url && (
                              <Button asChild size="sm" variant="outline" className="hover:bg-emerald-50">
                                <a href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Open</a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/** Pagination controls aligned with admin list **/}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
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
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  )
}