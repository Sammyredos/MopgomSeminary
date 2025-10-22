'use client'

import { useEffect } from 'react'

// Global title manager - sets a constant title across the app
export function TitleManager() {
  useEffect(() => {
    // Set a single, consistent title for all pages
    if (typeof window !== 'undefined') {
      document.title = 'Mopgom Theological Seminary'
    }
  }, [])

  return null // This component doesn't render anything
}
