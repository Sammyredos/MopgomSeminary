'use client'

import React, { useEffect, useRef, useState } from 'react'

interface SecurePdfViewerProps {
  fileUrl: string
  watermarkText?: string
}

export default function SecurePdfViewer({ fileUrl, watermarkText }: SecurePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const loadingTaskRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true
    const loadPdfJs = async () => {
      const candidates = [
        'pdfjs-dist/webpack',
        'pdfjs-dist/build/pdf.mjs',
        'pdfjs-dist/legacy/build/pdf.mjs',
        'pdfjs-dist'
      ] as const

      for (const path of candidates) {
        try {
          console.info('[SecurePdfViewer] Attempting to import', path)
          const mod: any = await import(path)
          const lib = mod?.getDocument ? mod : (mod?.default?.getDocument ? mod.default : null)
          if (lib && typeof lib.getDocument === 'function') {
            console.info('[SecurePdfViewer] Loaded pdf.js from', path)
            return lib
          }
          console.warn('[SecurePdfViewer] Import succeeded but library shape unexpected for', path)
        } catch (err) {
          console.error('[SecurePdfViewer] Import failed for', path, err)
          // try next candidate
        }
      }

      throw new Error('Failed to load pdf.js library from pdfjs-dist')
    }

    const fetchPdfBytes = async (url: string) => {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          // Some servers require explicit accept header for binary
          'Accept': 'application/pdf,*/*'
        }
      })
      if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`)
      const buf = await res.arrayBuffer()
      return new Uint8Array(buf)
    }

    const renderPdf = async () => {
      try {
        setLoading(true)
        setError(null)
        // Load pdf.js with robust path fallbacks across versions/builds
        const pdfjsLib = await loadPdfJs()
        // Try to enable Worker for performance if available
        try {
          // If webpack entry was used, workerPort is already set.
          // If not, provide a same-origin worker script as fallback.
          const gwo = pdfjsLib?.GlobalWorkerOptions
          const hasPort = !!gwo?.workerPort
          if (gwo && !hasPort) {
            gwo.workerSrc = '/api/pdfjs/worker'
          }
        } catch (e) {
          console.warn('Failed to configure pdf.js worker; falling back to main thread.', e)
        }
        // NOTE: disableWorker slows parsing; kept to avoid bundler worker config issues.
        // We’ll optimize perceived performance by rendering the first page immediately,
        // then schedule remaining pages during idle time.
        const gwo = pdfjsLib?.GlobalWorkerOptions
        let pdf: any

        // First attempt: let pdf.js fetch by URL (fast path)
        try {
          const loadingTask = pdfjsLib.getDocument({ url: fileUrl, disableWorker: !(gwo && (gwo.workerPort || gwo.workerSrc)) })
          loadingTaskRef.current = loadingTask
          pdf = await loadingTask.promise
        } catch (err) {
          console.warn('[SecurePdfViewer] URL load failed, trying data fallback:', err)
          // Fallback: fetch bytes ourselves to avoid encoding/CORS/OneDrive oddities
          const bytes = await fetchPdfBytes(fileUrl)
          const loadingTask = pdfjsLib.getDocument({ data: bytes, disableWorker: !(gwo && (gwo.workerPort || gwo.workerSrc)) })
          loadingTaskRef.current = loadingTask
          pdf = await loadingTask.promise
        }
        if (!isMounted || !containerRef.current) return

        // Clear previous content
        containerRef.current.innerHTML = ''
        const scale = 1.0 // slightly lower for faster initial render

        const renderPage = async (pageNum: number) => {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) return
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.display = 'block'
          canvas.style.margin = '0 auto 16px auto'
          canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
          canvas.style.borderRadius = '8px'
          canvas.style.backgroundColor = '#fff'
          canvas.style.userSelect = 'none'
          await page.render({ canvasContext: context, viewport }).promise
          if (!containerRef.current) return
          containerRef.current.appendChild(canvas)
        }

        // Render first page ASAP and switch off loading state to improve perceived speed
        await renderPage(1)
        setLoading(false)

        // Schedule the rest in the background using requestIdleCallback or setTimeout
        const schedule = (fn: () => void) => {
          if ('requestIdleCallback' in window) {
            ;(window as any).requestIdleCallback(fn)
          } else {
            setTimeout(fn, 0)
          }
        }

        for (let pageNum = 2; pageNum <= pdf.numPages; pageNum++) {
          if (!isMounted) break
          schedule(() => {
            // no await here to avoid blocking UI thread; fire-and-forget
            renderPage(pageNum).catch(err => console.warn('Render page failed', err))
          })
        }
      } catch (e: any) {
        console.error('SecurePdfViewer error:', e)
        const message =
          typeof e?.message === 'string' && e.message.trim().length > 0
            ? e.message
            : 'Failed to load document'
        setError(message)
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
      try {
        const task = loadingTaskRef.current
        if (task && typeof task.destroy === 'function') {
          task.destroy()
        }
      } catch (err) {
        console.warn('[SecurePdfViewer] Failed to destroy loading task:', err)
      } finally {
        loadingTaskRef.current = null
      }
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [fileUrl])

  return (
    <div className="relative">
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
        className="relative z-10 select-none"
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Document viewer"
      />

      {/* States */}
      {loading && (
        <div className="text-center text-sm text-gray-600 py-6">Loading document…</div>
      )}
      {error && (
        <div className="text-center text-sm text-red-600 py-6">
          {error}
          <div className="mt-2 text-xs text-gray-500">
            Try reloading the page. If it persists, the document URL may be
            invalid or blocked. We’ve attempted both direct and binary loads.
          </div>
        </div>
      )}
    </div>
  )
}