'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModernDatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
  label?: string
  required?: boolean
  minDate?: string
  maxDate?: string
}

export function ModernDatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className = '',
  error = false,
  label,
  required = false,
  minDate,
  maxDate
}: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value))
      setCurrentMonth(new Date(value))
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatInputDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date at noon to avoid timezone issues
      days.push(new Date(year, month, day, 12, 0, 0, 0))
    }

    return days
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    onChange(formatInputDate(date))
    setIsOpen(false)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate)) return true
    if (maxDate && date > new Date(maxDate)) return true
    return false
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Generate year options (current year back to 100 years ago)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - i)

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block font-apercu-medium text-sm text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={cn(
          'relative w-full cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <div
            className={cn(
              'flex items-center justify-between w-full pl-10 pr-4 h-12 border bg-white font-apercu-regular rounded-md border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500',
              isOpen && 'ring-2 ring-indigo-500 ring-opacity-50',
              className
            )}
          >
            <span className={cn(
              'text-sm',
              selectedDate ? 'text-gray-900' : 'text-gray-500'
            )}>
              {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
            </span>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-3 w-3 text-gray-600" />
            </button>

            <div className="flex items-center space-x-1">
              <select
                value={currentMonth.getMonth()}
                onChange={(e) => {
                  const newMonth = new Date(currentMonth)
                  newMonth.setMonth(parseInt(e.target.value))
                  setCurrentMonth(newMonth)
                }}
                className="px-1 py-0.5 border border-gray-200 rounded text-xs font-apercu-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={currentMonth.getFullYear()}
                onChange={(e) => {
                  const newMonth = new Date(currentMonth)
                  newMonth.setFullYear(parseInt(e.target.value))
                  setCurrentMonth(newMonth)
                }}
                className="px-1 py-0.5 border border-gray-200 rounded text-xs font-apercu-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-3 w-3 text-gray-600" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-apercu-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {getDaysInMonth(currentMonth).map((date, index) => (
              <div key={index} className="aspect-square">
                {date && (
                  <button
                    type="button"
                    onClick={() => !isDateDisabled(date) && handleDateSelect(date)}
                    disabled={isDateDisabled(date)}
                    className={cn(
                      'w-full h-full flex items-center justify-center text-xs font-apercu-regular rounded transition-all duration-200',
                      isSelected(date)
                        ? 'bg-indigo-600 text-white font-apercu-bold'
                        : isToday(date)
                        ? 'bg-indigo-100 text-indigo-700 font-apercu-medium'
                        : 'text-gray-700 hover:bg-gray-100',
                      isDateDisabled(date) && 'text-gray-300 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {date.getDate()}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="text-xs font-apercu-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-apercu-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
