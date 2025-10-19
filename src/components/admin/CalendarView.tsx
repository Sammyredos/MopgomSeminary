'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
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

export function CalendarView({ events, onEventClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Get events for current month
  const monthEvents = events.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    return (eventStart <= monthEnd && eventEnd >= monthStart);
  });

  // Get events for a specific date
  const getEventsForDate = (date: number) => {
    const targetDate = new Date(currentYear, currentMonth, date);
    return monthEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return targetDate >= eventStart && targetDate <= eventEnd;
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
    setCurrentDate(new Date());
    setSelectedDate(new Date());
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
    const days: JSX.Element[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-100"></div>
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
            "h-16 sm:h-20 md:h-24 border border-gray-100 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-50 flex flex-col",
            isCurrentDay && "bg-blue-50 border-blue-200",
            isSelectedDay && "bg-blue-100 border-blue-300"
          )}
        >
          <div className={cn(
            "text-xs sm:text-sm font-medium mb-1 flex-shrink-0",
            isCurrentDay && "text-blue-600",
            isSelectedDay && "text-blue-700"
          )}>
            {date}
          </div>
          
          {/* Event indicators - Responsive Flexbox Layout */}
          <div className="flex flex-col gap-0.5 flex-1 min-h-0">
            {/* Mobile: Show only dots, Desktop: Show event titles */}
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
            
            {/* Desktop: Show event titles with improved flexbox */}
            <div className="hidden sm:flex sm:flex-col sm:gap-1 sm:flex-1 sm:min-h-0">
              {dayEvents.slice(0, 3).map((event, index) => (
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
              
              {/* Show more indicator with better spacing */}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 px-1.5 py-0.5 font-medium flex-shrink-0">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Calendar View</span>
            <span className="sm:hidden">Calendar</span>
          </CardTitle>
          
          <div className="flex items-center gap-1 sm:gap-2">
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
        
        <div className="text-xl sm:text-2xl font-bold text-center">
          {monthNames[currentMonth]} {currentYear}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1 sm:py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
          {generateCalendarDays()}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 justify-center">
          {Object.entries(eventTypeColors).map(([type, colorClass]) => (
            <div key={type} className="flex items-center gap-1 sm:gap-2">
              <div className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded", eventTypeDots[type as keyof typeof eventTypeDots])} />
              <span className="text-xs sm:text-sm text-gray-600">
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
        
        {/* Selected date info */}
        {selectedDate && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
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
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarView;