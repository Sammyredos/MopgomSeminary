import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular' | 'button'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 rounded relative overflow-hidden'
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    button: 'h-10 rounded-lg'
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: ''
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    >
      {animation === 'wave' && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      )}
    </div>
  )
}

interface FormSkeletonProps {
  showProgressBar?: boolean
  showHeader?: boolean
  step?: 1 | 2 | 3
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({
  showProgressBar = true,
  showHeader = true,
  step = 1
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        {showHeader && (
          <div className="mb-8 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="mb-6">
              <Skeleton variant="text" width="120px" className="mb-2" />
            </div>
            
            <div className="text-center">
              <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-4" />
              <Skeleton variant="text" width="280px" className="mx-auto mb-2" />
              <Skeleton variant="text" width="320px" className="mx-auto" />
            </div>

            {/* Progress Indicator Skeleton */}
            {showProgressBar && (
              <div className="mt-6 sm:mt-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                  {/* Step 1 */}
                  <div className="flex items-center">
                    <Skeleton variant="circular" width={32} height={32} />
                    <div className="ml-2 lg:ml-3">
                      <Skeleton variant="text" width="80px" className="mb-1" />
                      <Skeleton variant="text" width="100px" className="hidden sm:block" />
                    </div>
                  </div>

                  {/* Connector Line */}
                  <Skeleton variant="rectangular" width={48} height={2} />

                  {/* Step 2 */}
                  <div className="flex items-center">
                    <Skeleton variant="circular" width={32} height={32} />
                    <div className="ml-2 lg:ml-3">
                      <Skeleton variant="text" width="100px" className="mb-1" />
                      <Skeleton variant="text" width="120px" className="hidden sm:block" />
                    </div>
                  </div>

                  {/* Connector Line */}
                  <Skeleton variant="rectangular" width={48} height={2} />

                  {/* Step 3 */}
                  <div className="flex items-center">
                    <Skeleton variant="circular" width={32} height={32} />
                    <div className="ml-2 lg:ml-3">
                      <Skeleton variant="text" width="110px" className="mb-1" />
                      <Skeleton variant="text" width="90px" className="hidden sm:block" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Card Skeleton */}
        <div className="bg-white shadow-xl border rounded-lg animate-slide-in-up" style={{borderColor: '#efefef', animationDelay: '0.3s'}}>
          <div className="p-6 sm:p-8">
            {/* Form Header */}
            <div className="mb-6 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center mb-2">
                <Skeleton variant="circular" width={20} height={20} className="mr-2" />
                <Skeleton variant="text" width="140px" />
              </div>
              <Skeleton variant="text" width="400px" />
            </div>

            {/* Form Fields based on step */}
            {step === 1 && (
              <div className="animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
                {/* Three column grid for personal data */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton variant="text" width="80px" />
                      <Skeleton variant="rectangular" height={42} className="w-full" />
                    </div>
                  ))}
                </div>

                {/* Additional fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton variant="text" width="100px" />
                      <Skeleton variant="rectangular" height={42} className="w-full" />
                    </div>
                  ))}
                </div>

                {/* Full width fields */}
                <div className="space-y-6 mb-6">
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton variant="text" width="120px" />
                      <Skeleton variant="rectangular" height={42} className="w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
                {/* School fields */}
                <div className="space-y-6 mb-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton variant="text" width="150px" />
                        <Skeleton variant="button" width="80px" />
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, fieldIndex) => (
                          <div key={fieldIndex} className="space-y-2">
                            <Skeleton variant="text" width="100px" />
                            <Skeleton variant="rectangular" height={42} className="w-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
                {/* Login credentials */}
                <div className="space-y-6 mb-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton variant="text" width="120px" />
                      <Skeleton variant="rectangular" height={42} className="w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200 animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
              {step > 1 && (
                <Skeleton variant="button" width="100px" />
              )}
              <div className={step === 1 ? 'ml-auto' : ''}>
                <Skeleton variant="button" width="100px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Skeleton, FormSkeleton }