"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple Avatar implementation without Radix UI dependencies
function Avatar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function AvatarImage({
  className,
  onError,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    // Hide the image element on error to prevent broken image icons
    // The AvatarFallback will remain visible underneath
    try {
      (e.currentTarget as HTMLImageElement).style.display = 'none'
    } catch {}
    if (onError) onError(e)
  }

  return (
    <img
      data-slot="avatar-image"
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={handleError}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex h-full w-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
