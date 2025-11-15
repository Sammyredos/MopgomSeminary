'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FileDigit } from 'lucide-react'

interface SecurePdfViewerProps {
  fileUrl: string
  title?: string
  watermarkText?: string
  subjectLabel?: string
  description?: string
}

export default function SecurePdfViewer({ fileUrl, title, watermarkText, subjectLabel, description }: SecurePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pdfDocRef = useRef<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    let isMounted = true
    // Load pdf.js via module script to bypass bundler resolution issues
    const ensurePdfJsOnWindow = async () => {
      if ((window as any).pdfjsLib) return (window as any).pdfjsLib
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.type = 'module'
        s.src = '/api/pdfjs/runtime'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Failed to load pdf.js runtime script'))
        document.head.appendChild(s)
      })
      const lib = (window as any).pdfjsLib
      if (!lib) throw new Error('pdfjsLib not available on window after load')
      return lib
    }

    const renderPdf = async () => {
      try {
        setLoading(true)
        setError(null)
        // Use pdf.js runtime attached to window by module script
        const pdfjsLib = await ensurePdfJsOnWindow()
        // Configure worker to a stable same-origin route to avoid bundler issues
        try {
          const gwo = pdfjsLib?.GlobalWorkerOptions
          if (gwo) {
            gwo.workerSrc = '/api/pdfjs/worker'
          }
        } catch (e) {
          console.warn('Failed to configure pdf.js worker; continuing without worker.', e)
        }
        // NOTE: Disable worker for reliability under Next.js bundling.
        // First page renders quickly; remaining pages are scheduled in idle time.
        let pdf
        try {
          const loadingTask = pdfjsLib.getDocument({ url: fileUrl, disableWorker: true })
          pdf = await loadingTask.promise
        } catch (primaryErr) {
          // Fallback: fetch the PDF as binary and pass data to pdf.js
          const resp = await fetch(fileUrl, { credentials: 'include' })
          if (!resp.ok) {
            throw new Error(`Failed to fetch PDF (${resp.status})`)
          }
          const buf = await resp.arrayBuffer()
          const loadingTask2 = pdfjsLib.getDocument({ data: new Uint8Array(buf), disableWorker: true })
          pdf = await loadingTask2.promise
        }
        if (!isMounted || !containerRef.current) return
        pdfDocRef.current = pdf
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
        // Render the first page responsively
        await renderCurrentPage()
        setLoading(false)
      } catch (e: any) {
        console.error('SecurePdfViewer error:', e)
        setError(e?.message || 'Failed to load document')
      } finally {
        // keep loading flag controlled by first-page completion for better UX
      }
    }

    renderPdf()

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
      if (ctrlOrCmd && ['s', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      isMounted = false
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [fileUrl])

  // Render the current page with responsive scaling
  const renderCurrentPage = async () => {
    const pdf = pdfDocRef.current
    if (!pdf || !containerRef.current) return
    try {
      const page = await pdf.getPage(currentPage)
      const baseViewport = page.getViewport({ scale: 1 })
      const containerWidth = containerRef.current.clientWidth || baseViewport.width
      // Scale the page to exactly match the container width on small/tablet screens.
      // Keep existing large-screen behavior but cap the upscale to avoid overly large canvases.
      const ratio = containerWidth / baseViewport.width
      const deviceScale = Math.min(ratio, 1.6)
      const viewport = page.getViewport({ scale: deviceScale })
      // Prepare canvases (crossfade)
      const prevCanvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement | null
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return
      // Improve sharpness on high-DPI screens
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3)
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      // Match canvas CSS width exactly to computed viewport width to avoid blur
      // Match CSS width to the container to ensure true responsiveness
      canvas.style.width = `${Math.floor(containerWidth)}px`
      canvas.style.display = 'block'
      canvas.style.margin = '0 auto 16px auto'
      canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
      canvas.style.borderRadius = '8px'
      canvas.style.backgroundColor = '#fff'
      canvas.style.userSelect = 'none'
      // Smooth crossfade transition when rendering a new page
      canvas.style.opacity = '0'
      canvas.style.transform = 'translateY(6px) scale(0.995)'
      canvas.style.transition = 'opacity 420ms ease, transform 420ms ease'
      canvas.style.willChange = 'opacity, transform'
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      await page.render({ canvasContext: context, viewport }).promise
      containerRef.current.appendChild(canvas)
      // Trigger transition to visible state after render completes
      requestAnimationFrame(() => {
        canvas.style.opacity = '1'
        canvas.style.transform = 'translateY(0) scale(1)'
      })
      // Fade out the previous canvas (if any) and remove after transition
      if (prevCanvas) {
        prevCanvas.style.transition = 'opacity 420ms ease, transform 420ms ease'
        prevCanvas.style.willChange = 'opacity, transform'
        prevCanvas.style.pointerEvents = 'none'
        requestAnimationFrame(() => {
          prevCanvas.style.opacity = '0'
          prevCanvas.style.transform = 'translateY(-6px) scale(0.995)'
        })
        const removePrev = () => {
          prevCanvas.removeEventListener('transitionend', removePrev)
          if (prevCanvas.parentElement) prevCanvas.parentElement.removeChild(prevCanvas)
        }
        prevCanvas.addEventListener('transitionend', removePrev)
        // Fallback removal in case transitionend doesn’t fire
        setTimeout(() => {
          if (prevCanvas && prevCanvas.parentElement) prevCanvas.parentElement.removeChild(prevCanvas)
        }, 600)
      }
    } catch (err) {
      console.warn('Render page failed', err)
    }
  }

  // Re-render when page changes
  useEffect(() => {
    renderCurrentPage()
    // After changing page, scroll viewer container to top for better UX
    if (containerRef.current) {
      try {
        // Prefer smooth scroll to top of the nearest scrollable container
        const el = containerRef.current
        // Scroll the element into view at the top of the page content
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Additionally, if a parent has overflow, ensure it scrolls to top
        const parent = el.parentElement
        if (parent) {
          const style = window.getComputedStyle(parent)
          const isScrollable = /(auto|scroll)/.test(style.overflowY || '')
          if (isScrollable) {
            parent.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
        // Fallback to window scroll if needed
        if (typeof window !== 'undefined') {
          const y = el.getBoundingClientRect().top + window.scrollY - 24
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
        }
      } catch (e) {
        // Non-critical: ignore any scrolling errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  // Handle resize to keep canvas responsive
  useEffect(() => {
    const onResize = () => {
      renderCurrentPage()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full mx-auto">
      {/* Info Header with Green Border */}
      <div className="p-4 sm:p-5 mb-3 border border-emerald-200 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white flex-shrink-0">
              <FileDigit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {title && (
                <h2 className="font-apercu-bold text-base text-gray-900 truncate" title={title}>{title}</h2>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[11px] px-2 py-1">PDF</Badge>
                {subjectLabel && (
                  <Badge variant="outline" className="text-[11px] capitalize">{subjectLabel}</Badge>
                )}
                {totalPages > 0 && (
                  <Badge variant="outline" className="text-[11px]">Pages: {totalPages}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Description removed per request */}
      </div>
      {/* Watermark Overlay */}
      {watermarkText && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            zIndex: 5,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: 'rotate(-30deg)',
              opacity: 0.12,
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: 600,
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gridAutoRows: '80px',
              gap: '16px',
            }}
          >
            {Array.from({ length: 300 }).map((_, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>{watermarkText}</div>
            ))}
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative z-10 select-none w-full"
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Document viewer"
      />

      {/* States */}
      {loading && (
        <div className="text-center text-sm text-gray-600 py-6">Loading document…</div>
      )}
      {error && (
        <div className="text-center text-sm text-red-600 py-6">{error}</div>
      )}
      {/* Pagination */}
      {!loading && !error && totalPages > 0 && (
        <div className="flex items-center justify-between gap-4 px-2 py-3">
          <div className="text-sm font-apercu-medium text-gray-700">Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-xl border border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}