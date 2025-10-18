'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { AutoCalendarView } from '@/components/admin/AutoCalendarView';
import { ModernDatePicker } from '@/components/ui/modern-date-picker';
import { getDynamicAcademicYearOptions } from '@/lib/utils/dynamic-years';
import { useAcademicYear } from '@/hooks/useAcademicYear';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  GraduationCap,
  Clock,
  Users,
  CalendarDays,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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

interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  activeTerms: number;
  holidaysThisMonth: number;
}

const eventTypeColors = {
  TERM: 'bg-blue-100 text-blue-800',
  HOLIDAY: 'bg-green-100 text-green-800',
  EXAM: 'bg-red-100 text-red-800',
  EVENT: 'bg-purple-100 text-purple-800',
  MEETING: 'bg-orange-100 text-orange-800'
};

const eventTypeLabels = {
  TERM: 'Term',
  HOLIDAY: 'Holiday',
  EXAM: 'Exam',
  EVENT: 'Event',
  MEETING: 'Meeting'
};

function CalendarPageContent() {
  const router = useRouter();
  const { success, error } = useToast();
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    activeTerms: 0,
    holidaysThisMonth: 0
  });
  const [dataLoading, setDataLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Check authentication
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setSession(userData);
      } else {
        router.push('/admin/login');
        return;
      }
    } catch (err) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
      return;
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();   
  }, []);

  useEffect(() => {
    if (session) {
      fetchEvents();
    }
  }, [session]);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/calendar/stats', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };



  // Permission checks
  const userRole = (session?.user as any)?.role || '';
  const canCreate = true; // Temporarily allow all users to create events
  const canEdit = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'].includes(userRole);
  const canDelete = ['Super Admin', 'Principal', 'Admin'].includes(userRole);

  // Fetch events
  const fetchEvents = async () => {
    try {
      setDataLoading(true);
      const response = await fetch('/api/admin/calendar', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.events);
      
      // Calculate stats
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const totalEvents = data.events.length;
      const upcomingEvents = data.events.filter((event: CalendarEvent) => 
        new Date(event.startDate) > now
      ).length;
      const activeTerms = data.events.filter((event: CalendarEvent) => 
        event.eventType === 'TERM' && 
        new Date(event.startDate) <= now && 
        new Date(event.endDate) >= now
      ).length;
      const holidaysThisMonth = data.events.filter((event: CalendarEvent) => {
        const eventDate = new Date(event.startDate);
        return event.eventType === 'HOLIDAY' && 
               eventDate.getMonth() === thisMonth && 
               eventDate.getFullYear() === thisYear;
      }).length;
      
      setStats({
        totalEvents,
        upcomingEvents,
        activeTerms,
        holidaysThisMonth
      });
    } catch (err) {
      console.error('Error fetching events:', err);
      error('Failed to fetch calendar events');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsCreateModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const response = await fetch(`/api/admin/calendar?id=${eventToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to delete event');

      success('Calendar event deleted successfully');
      
      fetchEvents();
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      error('Failed to delete calendar event');
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6 px-6">


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              <p className="text-sm text-gray-500">All calendar events</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-green-100 rounded-md flex items-center justify-center">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              <p className="text-sm text-gray-500">Future events</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-purple-100 rounded-md flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Terms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTerms}</p>
              <p className="text-sm text-gray-500">Current academic terms</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-orange-100 rounded-md flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Holidays</p>
              <p className="text-2xl font-bold text-gray-900">{stats.holidaysThisMonth}</p>
              <p className="text-sm text-gray-500">This month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Event Button */}
      {canCreate && (
        <div className="flex justify-start items-center mb-8">
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateEvent} 
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 text-white shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 text-white" />
              <span className="text-white">New Event</span>
            </Button>
            <Button 
              onClick={() => setIsHistoryModalOpen(true)} 
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 text-gray-700 shadow-sm hover:shadow-md"
            >
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">History</span>
            </Button>
          </div>
        </div>
      )}

      {/* Auto Calendar View */}
      <div className="mt-4">
        <AutoCalendarView events={events} />
      </div>



      {/* Create/Edit Event Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchEvents}
      />
      
      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchEvents}
        event={selectedEvent}
      />
      
      <CalendarHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        events={events}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this calendar event? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteEvent}
            >
              Delete Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Calendar History Modal Component
function CalendarHistoryModal({ isOpen, onClose, events, onEdit, onDelete }: {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 7;

  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || event.eventType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.eventType.localeCompare(b.eventType);
        default:
          return 0;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-white shadow-2xl border-0 rounded-2xl">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            Calendar Event History
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">({filteredEvents.length})</span>
            {totalPages > 1 && (
              <span className="text-xs text-gray-400">Page {currentPage} of {totalPages}</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="flex-1">
            <Input
              placeholder="Search events by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-10 text-sm border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-gray-200">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="TERM">Academic Term</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                <SelectItem value="EXAM">Examination</SelectItem>
                <SelectItem value="EVENT">General Event</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'type') => setSortBy(value)}>
              <SelectTrigger className="w-32 h-10 text-sm border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-gray-200">
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="title">By Title</SelectItem>
                <SelectItem value="type">By Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto max-h-[400px] border-t border-gray-100 pt-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500 mb-1">No events found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedEvents.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:border-blue-200 transition-all duration-200 group hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate text-base">{event.title}</h3>
                        <Badge className={`${eventTypeColors[event.eventType]} text-xs px-2.5 py-1 font-medium rounded-full`}>
                          {eventTypeLabels[event.eventType]}
                        </Badge>
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{event.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded-md">{event.academicYear}</span>
                        {event.isRecurring && (
                          <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                            <Clock className="h-3.5 w-3.5" />
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onEdit(event);
                          onClose();
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"
                        title="Edit Event"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(event.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 bg-gray-50/50">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-lg font-medium transition-colors"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarPage() {
  return (
    <AdminLayoutNew 
      title="Calendar Management" 
      description="Manage academic calendar and events"
    >
      <CalendarPageContent />
    </AdminLayoutNew>
  );
}

// Create Event Modal Component
function CreateEventModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const { academicYears, currentAcademicYear } = useAcademicYear();
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'EVENT' as const,
    startDate: '',
    endDate: '',
    isRecurring: false,
    recurrencePattern: '',
    academicYear: ''
  });

  // Helper function to get auth headers
    const getAuthHeaders = () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    };

  // Set default academic year when modal opens
  useEffect(() => {
    if (isOpen && currentAcademicYear && !formData.academicYear) {
      setFormData(prev => ({ ...prev, academicYear: currentAcademicYear.year }));
    }
  }, [isOpen, currentAcademicYear, formData.academicYear]);

  // Validate form data
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (startDate < today) {
        errors.startDate = 'Event start date cannot be in the past. Please select a future date.';
      }
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    if (!formData.academicYear) {
      errors.academicYear = 'Academic year is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      success('Calendar event created successfully');
      
      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        eventType: 'EVENT',
        startDate: '',
        endDate: '',
        isRecurring: false,
        recurrencePattern: '',
        academicYear: ''
      });
    } catch (error: any) {
      error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Calendar Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  if (validationErrors.title) {
                    setValidationErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                className={validationErrors.title ? 'border-red-500' : ''}
                required
              />
              {validationErrors.title && (
                <p className="text-sm text-red-500">{validationErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERM">Term</SelectItem>
                  <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ModernDatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, startDate: date }));
                  if (validationErrors.startDate) {
                    setValidationErrors(prev => ({ ...prev, startDate: '' }));
                  }
                }}
                placeholder="Select start date"
                required
              />
              {validationErrors.startDate && (
                <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-200 text-xs font-normal">
                  {validationErrors.startDate}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <ModernDatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, endDate: date }));
                  if (validationErrors.endDate) {
                    setValidationErrors(prev => ({ ...prev, endDate: '' }));
                  }
                }}
                placeholder="Select end date"
                required
                minDate={formData.startDate}
              />
              {validationErrors.endDate && (
                <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-200 text-xs font-normal">
                  {validationErrors.endDate}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year *</Label>
            <Select
              value={formData.academicYear}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, academicYear: value }));
                if (validationErrors.academicYear) {
                  setValidationErrors(prev => ({ ...prev, academicYear: '' }));
                }
              }}
            >
              <SelectTrigger className={validationErrors.academicYear ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {getDynamicAcademicYearOptions().map((year) => (
                  <SelectItem key={year.id} value={year.year}>
                    {year.year} {year.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.academicYear && (
              <p className="text-sm text-red-500">{validationErrors.academicYear}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 font-medium"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Event Modal Component
function EditEventModal({ isOpen, onClose, onSuccess, event }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: CalendarEvent | null;
}) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const { academicYears } = useAcademicYear();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    eventType: 'TERM' | 'HOLIDAY' | 'EXAM' | 'EVENT' | 'MEETING';
    startDate: string;
    endDate: string;
    isRecurring: boolean;
    recurrencePattern: string;
    academicYear: string;
  }>({
    title: '',
    description: '',
    eventType: 'EVENT',
    startDate: '',
    endDate: '',
    isRecurring: false,
    recurrencePattern: '',
    academicYear: ''
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };



  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate.split('T')[0],
        isRecurring: event.isRecurring,
        recurrencePattern: event.recurrencePattern || '',
        academicYear: event.academicYear
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/calendar?id=${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update event');
      }

      success('Calendar event updated successfully');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Calendar Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERM">Term</SelectItem>
                  <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year *</Label>
            <Select
              value={formData.academicYear}
              onValueChange={(value) => setFormData(prev => ({ ...prev, academicYear: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {getDynamicAcademicYearOptions().map((year) => (
                  <SelectItem key={year.id} value={year.year}>
                    {year.year} {year.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}