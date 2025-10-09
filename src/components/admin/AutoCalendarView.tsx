'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: 'TERM' | 'HOLIDAY' | 'EXAM' | 'EVENT' | 'MEETING';
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AutoCalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  compact?: boolean;
  maxHeight?: number;
  className?: string;
  height?: number;
}

const eventTypeColors = {
  TERM: 'bg-blue-500 hover:bg-blue-600 text-white',
  HOLIDAY: 'bg-green-500 hover:bg-green-600 text-white',
  EXAM: 'bg-red-500 hover:bg-red-600 text-white',
  EVENT: 'bg-purple-500 hover:bg-purple-600 text-white',
  MEETING: 'bg-orange-500 hover:bg-orange-600 text-white'
};

const eventTypeDots = {
  TERM: 'bg-blue-500',
  HOLIDAY: 'bg-green-500',
  EXAM: 'bg-red-500',
  EVENT: 'bg-purple-500',
  MEETING: 'bg-orange-500'
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Dynamic year calculation logic
const getDynamicYears = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Academic year typically starts in August/September
  // If we're in Jan-July, we're in the second half of the academic year
  // If we're in Aug-Dec, we're in the first half of the academic year
  let academicCurrentYear, academicNextYear;
  
  if (currentMonth >= 7) { // August (7) to December (11)
    academicCurrentYear = currentYear;
    academicNextYear = currentYear + 1;
  } else { // January (0) to July (6)
    academicCurrentYear = currentYear - 1;
    academicNextYear = currentYear;
  }
  
  return {
    current_year: academicCurrentYear,
    next_year: academicNextYear,
    display_title: `${academicCurrentYear}-${academicNextYear}`,
    calendar_year: currentYear
  };
};

export function AutoCalendarView({ events, onEventClick, onDateClick, compact = false, maxHeight, className, height }: AutoCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [yearInfo, setYearInfo] = useState(getDynamicYears());
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Auto-update year information every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newYearInfo = getDynamicYears();
      const currentYearInfo = yearInfo;
      
      // Check if year has changed
      if (newYearInfo.current_year !== currentYearInfo.current_year || 
          newYearInfo.next_year !== currentYearInfo.next_year) {
        setYearInfo(newYearInfo);
        setLastUpdateTime(new Date());
        
        // Optionally refresh the calendar to current date when year changes
        setCurrentDate(new Date());
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [yearInfo]);

  // Manual refresh function
  const handleRefresh = () => {
    const newYearInfo = getDynamicYears();
    setYearInfo(newYearInfo);
    setCurrentDate(new Date());
    setLastUpdateTime(new Date());
  };

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Filter events for the current academic year range
  const academicYearEvents = events.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventYear = eventStart.getFullYear();
    return eventYear >= yearInfo.current_year && eventYear <= yearInfo.next_year;
  });

  // Get events for current month
  const monthEvents = academicYearEvents.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    return (eventStart <= monthEnd && eventEnd >= monthStart);
  });

  // Get events for a specific date
  const getEventsForDate = (date: number) => {
    // Normalize comparisons to day boundaries to avoid timezone offsets
    const toDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const targetDay = new Date(currentYear, currentMonth, date);
    return monthEvents.filter(event => {
      const start = toDay(new Date(event.startDate));
      const end = toDay(new Date(event.endDate));
      return targetDay >= start && targetDay <= end;
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    // Create today's date at noon to avoid timezone issues
    const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
    setSelectedDate(todayAtNoon);
  };

  // Check if date is today
  const isToday = (date: number) => {
    return today.getDate() === date && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  // Check if date is selected
  const isSelected = (date: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === date && 
           selectedDate.getMonth() === currentMonth && 
           selectedDate.getFullYear() === currentYear;
  };

  // Handle date click
  const handleDateClick = (date: number) => {
    // Create date at noon to avoid timezone issues
    const clickedDate = new Date(currentYear, currentMonth, date, 12, 0, 0, 0);
    setSelectedDate(clickedDate);
    onDateClick?.(clickedDate);
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-full rounded-lg"></div>
      );
    }
    
    // Add days of the month
    for (let date = 1; date <= daysInMonth; date++) {
      const dayEvents = getEventsForDate(date);
      const isCurrentDay = isToday(date);
      const isSelectedDay = isSelected(date);
      
      days.push(
        <div
          key={date}
          onClick={() => handleDateClick(date)}
          className={cn(
            "h-full p-1 cursor-pointer flex flex-col"
          )}
        >
          <div className={cn(
            compact ? "text-xs sm:text-sm font-medium mb-1 flex-shrink-0" : "text-sm sm:text-base font-medium mb-1 flex-shrink-0"
          )}>
            <span className={cn(
              "relative inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors",
              isCurrentDay ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700",
              isSelectedDay ? "ring-2 ring-indigo-400" : ""
            )}>
              {date}
              {dayEvents.length > 0 && (
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white",
                    eventTypeDots[dayEvents[0].eventType]
                  )}
                />
              )}
            </span>
          </div>
          
          {/* Event indicators */}
          <div className="flex flex-col gap-0.5 flex-1 min-h-0">
            {/* Mobile: Show only dots */}
            <div className="sm:hidden">
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {dayEvents.slice(0, 8).map((event) => (
                    <div
                      key={`dot-${event.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={cn(
                        "w-2 h-2 rounded-full cursor-pointer flex-shrink-0",
                        eventTypeDots[event.eventType]
                      )}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 8 && (
                    <div className="text-xs text-gray-500 font-medium">+{dayEvents.length - 8}</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Desktop: Show minimal dots in compact mode, titles otherwise */}
            {compact ? (
              <div className="hidden sm:block">
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayEvents.slice(0, 8).map((event) => (
                      <div
                        key={`dot-desktop-${event.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className={cn(
                          "w-2 h-2 rounded-full cursor-pointer flex-shrink-0",
                          eventTypeDots[event.eventType]
                        )}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 8 && (
                      <div className="text-xs text-gray-500 font-medium">+{dayEvents.length - 8}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex sm:flex-col sm:gap-1 sm:flex-1 sm:min-h-0">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors flex-shrink-0",
                      eventTypeColors[event.eventType]
                    )}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-1.5 py-0.5 font-medium flex-shrink-0">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <Card className={cn("w-full bg-white", compact && "overflow-hidden", className)} style={(compact && maxHeight) || height ? { maxHeight, height } : undefined}>
      <CardHeader className={compact ? "py-2" : "pb-4"}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-8 w-8 sm:h-10 sm:w-10",
              "bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center"
            )}>
              <CalendarIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", "text-white")} />
            </div>
            <CardTitle>
              <span className="text-sm sm:text-base font-semibold">{monthNames[currentMonth]} {currentYear}</span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {!compact && (
              <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh year info">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={goToToday}>
              <span className="hidden sm:inline">Today</span>
              <span className="sm:hidden">Now</span>
            </Button>
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!compact && (
          <div className="text-center space-y-2 mt-2">
            <div className="text-xl sm:text-2xl font-bold">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Academic Year: {yearInfo.display_title}
              </Badge>
              <div className="text-xs text-gray-500">
                Current: {yearInfo.current_year} | Next: {yearInfo.next_year}
              </div>
            </div>
            <div className="text-xs text-gray-400" suppressHydrationWarning>
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className={compact ? "pt-0 flex flex-col" : "flex flex-col"}>
        {/* Academic Year Events Summary */}
        {!compact && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Academic Year {yearInfo.display_title} Overview
            </div>
            <div className="text-xs text-blue-600">
              Showing {academicYearEvents.length} events across both years
            </div>
          </div>
        )}

        {/* Day headers */}
        <div className={cn("grid grid-cols-7 mb-2", compact && "mb-1")}
        >
          {dayNames.map((day) => (
            <div key={day} className={cn("text-center font-medium text-gray-500", compact ? "text-xs sm:text-sm py-1" : "text-sm sm:text-base py-1 sm:py-2")}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 grid-rows-6 gap-1">
          {generateCalendarDays()}
        </div>

        {/* Compact legend and hint placed at bottom */}
        {compact && (
          <div className="px-2 mt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {Object.entries(eventTypeDots).map(([type, cls]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded", cls)} />
                  <span className="text-[11px] text-gray-600">
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center text-[11px] text-gray-500 mt-2">
              Click a day to view events
            </div>
          </div>
        )}
        
        {/* Legend */}
        {!compact && (
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 justify-center">
            {Object.entries(eventTypeColors).map(([type]) => (
              <div key={type} className="flex items-center gap-1 sm:gap-2">
                <div className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded", eventTypeDots[type as keyof typeof eventTypeDots])} />
                <span className="text-xs sm:text-sm text-gray-600">
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Selected date info */}
        {selectedDate && !compact && (
          <div className="mt-4 flex justify-center">
            <div className="p-3 bg-gray-50 rounded-lg max-w-md w-full text-center">
              <h4 className="font-medium mb-2">
              Events for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              </h4>
              
              {getEventsForDate(selectedDate.getDate()).length === 0 ? (
              <p className="text-sm text-gray-500">No events scheduled</p>
              ) : (
              <div className="space-y-2">
                {getEventsForDate(selectedDate.getDate()).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="flex items-center gap-3 p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className={cn("w-3 h-3 rounded", eventTypeDots[event.eventType])} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{event.title}</div>
                      {event.description && (
                        <div className="text-xs text-gray-500">{event.description}</div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {event.eventType}
                    </Badge>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AutoCalendarView;