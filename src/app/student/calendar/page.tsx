'use client';

import React, { useState, useEffect } from 'react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { ProtectedRoute } from '@/components/student/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  BookOpen,
  GraduationCap,
  Users,
  AlertCircle
} from 'lucide-react';
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

const eventTypeColors = {
  TERM: 'bg-blue-100 text-blue-800 border-blue-200',
  HOLIDAY: 'bg-green-100 text-green-800 border-green-200',
  EXAM: 'bg-red-100 text-red-800 border-red-200',
  EVENT: 'bg-purple-100 text-purple-800 border-purple-200',
  MEETING: 'bg-orange-100 text-orange-800 border-orange-200'
};

const eventTypeIcons = {
  TERM: BookOpen,
  HOLIDAY: CalendarIcon,
  EXAM: GraduationCap,
  EVENT: Users,
  MEETING: AlertCircle
};

const eventTypeDots = {
  TERM: 'bg-blue-500',
  HOLIDAY: 'bg-green-500',
  EXAM: 'bg-red-500',
  EVENT: 'bg-purple-500',
  MEETING: 'bg-orange-500'
};

function StudentCalendarContent() {
  const { error } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Calendar navigation
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Fetch calendar events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/calendar', {
        headers: {
          'auth-token': localStorage.getItem('auth-token') || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const isToday = (date: number) => {
    const today = new Date();
    return today.getDate() === date && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const isSelected = (date: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === date && 
           selectedDate.getMonth() === currentMonth && 
           selectedDate.getFullYear() === currentYear;
  };

  const getEventsForDate = (date: number) => {
    const targetDate = new Date(currentYear, currentMonth, date);
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return targetDate >= eventStart && targetDate <= eventEnd;
    });
  };

  const handleDateClick = (date: number) => {
    const clickedDate = new Date(currentYear, currentMonth, date, 12, 0, 0, 0);
    setSelectedDate(clickedDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const generateCalendarDays = () => {
    const days: JSX.Element[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 border border-gray-100"></div>
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
            "h-20 border border-gray-100 p-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 flex flex-col",
            isCurrentDay && "bg-blue-50 border-blue-200",
            isSelectedDay && "bg-blue-100 border-blue-300"
          )}
        >
          <div className={cn(
            "text-sm font-medium mb-1 flex-shrink-0",
            isCurrentDay && "text-blue-600",
            isSelectedDay && "text-blue-700"
          )}>
            {date}
          </div>
          
          {/* Event indicators */}
          <div className="flex flex-wrap gap-1 flex-1 min-h-0">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className={cn("w-2 h-2 rounded-full", eventTypeDots[event.eventType])}
                title={event.title}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 3}</div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <StudentLayout 
          title="Academic Calendar"
          description="View important dates and events"
        >
          <div className="min-h-screen">
            <div className="space-y-6">
              {/* Calendar Header Skeleton */}
              <Card className="shadow-xl border-2 border-[#efefef] backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
                      <div className="h-6 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Calendar Content Skeleton */}
              <Card className="shadow-xl border-2 border-[#efefef] backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-6 w-40"></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-32"></div>
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <StudentLayout 
        title="Academic Calendar"
        description="View important dates and events"
      >
        <div className="space-y-6">
            {/* Cards Container with Flex Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar Card */}
              <Card className="bg-white shadow-sm flex-1">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">
                      {monthNames[currentMonth]} {currentYear}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {dayNames.map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
                    {generateCalendarDays()}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 justify-center">
                    {Object.entries(eventTypeColors).map(([type, colorClass]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded", eventTypeDots[type as keyof typeof eventTypeDots])} />
                        <span className="text-sm text-gray-600">
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Selected date info */}
                  {selectedDate && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">
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
                        <div className="space-y-3">
                          {getEventsForDate(selectedDate.getDate()).map((event) => {
                            const IconComponent = eventTypeIcons[event.eventType];
                            return (
                              <div
                                key={event.id}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg border"
                              >
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", eventTypeColors[event.eventType])}>
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{event.title}</div>
                                  {event.description && (
                                    <div className="text-xs text-gray-600 mt-1">{event.description}</div>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {event.eventType}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events Card */}
              <Card className="bg-white shadow-sm lg:w-80 flex-shrink-0">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.filter(event => new Date(event.startDate) > new Date()).slice(0, 5).length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming events</p>
                  ) : (
                    <div className="space-y-3">
                      {events
                        .filter(event => new Date(event.startDate) > new Date())
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .slice(0, 5)
                        .map((event) => {
                          const IconComponent = eventTypeIcons[event.eventType];
                          return (
                            <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", eventTypeColors[event.eventType])}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{event.title}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(event.startDate).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {event.eventType}
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}

export default function StudentCalendarPage() {
  return <StudentCalendarContent />;
}