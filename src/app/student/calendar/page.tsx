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
  Clock,
  MapPin,
  BookOpen,
  GraduationCap,
  Users,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AutoCalendarView from '@/components/admin/AutoCalendarView';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  // Responsive: top-level hook to manage compact mode; avoids nested hooks errors
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get first day of month and number of days
  // Deprecated manual calendar calculations removed in favor of AutoCalendarView

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
  // Selection state handled via onDateClick from AutoCalendarView

  const getEventsForDate = (date: number) => {
    const baseDate = selectedDate || new Date();
    const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), date);
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return targetDate >= eventStart && targetDate <= eventEnd;
    });
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
            {/* Cards Container with Flex Layout (stack on tablets, side-by-side on desktop) */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar Card */}
              <Card className="bg-white shadow-sm flex-1">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Live Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <AutoCalendarView
                    events={events}
                    onDateClick={(date) => setSelectedDate(date)}
                    compact={isCompact}
                    height={isCompact ? 360 : 420}
                  />
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
                              <div key={event.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
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
              <Card className="bg-white shadow-sm md:w-full lg:w-80 flex-shrink-0">
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