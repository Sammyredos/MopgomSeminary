'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  UserCog,
  GraduationCap
} from 'lucide-react';
import { StatsCard, StatsGrid } from '@/components/ui/stats-card';
import { getDynamicAcademicYearOptions } from '@/lib/utils/dynamic-years';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAcademicYear } from '@/hooks/useAcademicYear';

interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
  isCurrent: boolean;
}

interface ClassSession {
  id: string;
  subjectId: string;
  teacherId: string;
  courseId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  duration: number;
  academicYear: string;
  term?: string;
  isActive: boolean;
  subject: {
    id: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
  };
  teacher: {
    id: string;
    teacherId: string;
    fullName: string;
    emailAddress: string;
    department: string;
    position: string;
  };
  classroom: {
    id: string;
    roomNumber: string;
    roomName: string;
    capacity: number;
    roomType: string;
    building: string;
    floor: number;
  };
}

interface TimetableData {
  Monday: ClassSession[];
  Tuesday: ClassSession[];
  Wednesday: ClassSession[];
  Thursday: ClassSession[];
  Friday: ClassSession[];
  Saturday: ClassSession[];
  Sunday: ClassSession[];
}

interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  department: string;
}

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
}

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  capacity: number;
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function TimetablePageContent() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [timetableData, setTimetableData] = useState<TimetableData>({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  // Use the shared academic year hook
  const {
    academicYears,
    selectedAcademicYear,
    setSelectedAcademicYear,
    currentAcademicYear,
    isLoading: academicYearLoading,
    handleRefresh: refreshAcademicYear,
    generateDefaultAcademicYear
  } = useAcademicYear();
  
  const [selectedTerm, setSelectedTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    courseId: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    duration: 60,
    academicYear: '',
    term: '',
    isActive: true
  });

  // Permission checks
  const canCreate = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'].includes(currentUser?.role?.name || '');
  const canEdit = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'].includes(currentUser?.role?.name || '');
  const canDelete = ['Super Admin', 'Principal', 'Admin'].includes(currentUser?.role?.name || '');

  // Update form data when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      setFormData(prev => ({ ...prev, academicYear: selectedAcademicYear }));
    }
  }, [selectedAcademicYear]);

  // Check authentication on component mount
  useEffect(() => {
    if (!currentUser) {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [currentUser, selectedTeacher, selectedCourse, selectedDay, selectedAcademicYear, selectedTerm, router]);

  // Update form data when academic years are loaded
  useEffect(() => {
    if (academicYears.length > 0 && !formData.academicYear) {
      const defaultYear = generateDefaultAcademicYear();
      setFormData(prev => ({ ...prev, academicYear: defaultYear }));
    }
  }, [academicYears, formData.academicYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedTeacher) params.append('teacherId', selectedTeacher);
      if (selectedCourse) params.append('courseId', selectedCourse);
      if (selectedDay) params.append('dayOfWeek', selectedDay);
      if (selectedAcademicYear) params.append('academicYear', selectedAcademicYear);
      if (selectedTerm) params.append('term', selectedTerm);
      params.append('limit', '200'); // Get more sessions for timetable view

      const [sessionsRes, teachersRes, subjectsRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/timetable?${params}`),
        fetch('/api/admin/teachers?limit=100'),
        fetch('/api/admin/subjects?limit=100'),
        fetch('/api/admin/courses?limit=100')
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setClassSessions(sessionsData.classSessions || []);
        setTimetableData(sessionsData.timetableData || {
          Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        });
      }

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData.teachers || []);
      }

      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData.subjects || []);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const response = await fetch('/api/admin/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Class session created successfully');
        setIsCreateModalOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create class session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create class session');
    }
  };

  const handleEditSession = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/admin/timetable?id=${selectedSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Class session updated successfully');
        setIsEditModalOpen(false);
        setSelectedSession(null);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update class session');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update class session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this class session?')) return;

    try {
      const response = await fetch(`/api/admin/timetable?id=${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Class session deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete class session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete class session');
    }
  };

  const resetForm = () => {
    setFormData({
      subjectId: '',
      teacherId: '',
      courseId: '',
      startTime: '',
      endTime: '',
      dayOfWeek: '',
      duration: 60,
      academicYear: generateDefaultAcademicYear(),
      term: '',
      isActive: true
    });
  };

  const openEditModal = (session: ClassSession) => {
    setSelectedSession(session);
    setFormData({
      subjectId: session.subjectId,
      teacherId: session.teacherId,
      courseId: session.courseId,
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: new Date(session.endTime).toISOString().slice(0, 16),
      dayOfWeek: session.dayOfWeek,
      duration: session.duration,
      academicYear: session.academicYear,
      term: session.term || '',
      isActive: session.isActive
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (session: ClassSession) => {
    setSelectedSession(session);
    setIsViewModalOpen(true);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getSessionColor = (subjectCode: string) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800'
    ];
    const index = subjectCode.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const filteredSessions = classSessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      session.subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.classroom.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTeacher && selectedTeacher !== 'all' && session.teacherId !== selectedTeacher) return false;
    if (selectedCourse && selectedCourse !== 'all' && session.courseId !== selectedCourse) return false;
    if (selectedDay && selectedDay !== 'all' && session.dayOfWeek !== selectedDay) return false;
    if (selectedTerm && selectedTerm !== 'all' && session.term !== selectedTerm) return false;
    
    return matchesSearch;
  });

  const stats = {
    totalSessions: classSessions.length,
    activeTeachers: new Set(classSessions.map(s => s.teacherId)).size,
    usedCourses: new Set(classSessions.map(s => s.courseId)).size,
    subjects: new Set(classSessions.map(s => s.subjectId)).size
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <TableSkeleton rows={8} columns={8} />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6 px-6">

      {/* Stats Cards - Consistent with Dashboard (Top of Page, no white card) */}
      <div className="mb-6">
        {loading ? (
          <StatsGrid columns={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCard
                key={i}
                title=""
                value=""
                icon={Calendar}
                gradient="bg-gradient-to-r from-gray-400 to-gray-500"
                bgGradient="bg-gradient-to-br from-white to-gray-50"
                loading={true}
              />
            ))}
          </StatsGrid>
        ) : (
          <StatsGrid columns={4}>
            <StatsCard
              title="Total Sessions"
              value={classSessions.length}
              subtitle="Scheduled classes"
              icon={Calendar}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
              bgGradient="bg-gradient-to-br from-white to-blue-50"
            />
            <StatsCard
              title="Instructors"
              value={teachers.length}
              subtitle="Active instructors"
              icon={UserCog}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
              bgGradient="bg-gradient-to-br from-white to-green-50"
            />
            <StatsCard
              title="Subjects"
              value={subjects.length}
              subtitle="Available subjects"
              icon={BookOpen}
              gradient="bg-gradient-to-r from-orange-500 to-amber-600"
              bgGradient="bg-gradient-to-br from-white to-orange-50"
            />
            <StatsCard
              title="Courses"
              value={courses.length}
              subtitle="Active courses"
              icon={GraduationCap}
              gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
              bgGradient="bg-gradient-to-br from-white to-purple-50"
            />
          </StatsGrid>
        )}
      </div>


      

      {/* Action Buttons */}
      {canCreate && (
        <div className="flex justify-start items-center mb-8">
          <div className="flex gap-3">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg transition-colors duration-200 flex items-center gap-3 text-white shadow-md hover:shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                  <span className="text-white">Add Session</span>
                </Button>
              </DialogTrigger>
            </Dialog>
            <div className="flex gap-3">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                className="px-6 py-4 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Calendar className="h-5 w-5" />
                Grid View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="px-6 py-4 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Eye className="h-5 w-5" />
                List View
              </Button>
            </div>
          </div>
        </div>
      )}

      {!canCreate && (
        <div className="flex justify-start items-center mb-8">
          <div className="flex gap-3">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="px-6 py-4 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Calendar className="h-5 w-5" />
              Grid View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="px-6 py-4 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Eye className="h-5 w-5" />
              List View
            </Button>
          </div>
        </div>
      )}



      {/* Filters */}
      <Card className="p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger>
              <SelectValue placeholder="All Instructors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instructors</SelectItem>
              {teachers.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.courseCode} - {course.courseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger>
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {daysOfWeek.map(day => (
                <SelectItem key={day} value={day}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.year}>
                    {year.year} {year.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAcademicYear}
              disabled={academicYearLoading}
              className="px-3"
              title="Refresh Academic Year"
            >
              <RefreshCw className={`h-4 w-4 ${academicYearLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger>
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              <SelectItem value="Term 1">Term 1</SelectItem>
              <SelectItem value="Term 2">Term 2</SelectItem>
              <SelectItem value="Term 3">Term 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      

      {/* Timetable Content */}
      {viewMode === 'grid' ? (
        <Card className="p-6 bg-white">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Timetable</h3>
          </div>
          <div>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-[800px]">
                {/* Header */}
                <div className="font-semibold text-center p-2 bg-gray-100 rounded">Time</div>
                {daysOfWeek.map(day => (
                  <div key={day} className="font-semibold text-center p-2 bg-gray-100 rounded">
                    {day}
                  </div>
                ))}
                
                {/* Time slots */}
                {timeSlots.map(time => (
                  <React.Fragment key={time}>
                    <div className="text-sm text-gray-600 p-2 border-r">{time}</div>
                    {daysOfWeek.map(day => {
                      const daySession = timetableData[day as keyof TimetableData]?.find(session => {
                        const sessionTime = formatTime(session.startTime);
                        return sessionTime === time;
                      });
                      
                      return (
                        <div key={`${day}-${time}`} className="min-h-[60px] p-1 border border-gray-200">
                          {daySession && (
                            <div 
                              className={`p-2 rounded text-xs border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                                getSessionColor(daySession.subject.subjectCode)
                              }`}
                              onClick={() => openViewModal(daySession)}
                            >
                              <div className="font-semibold">{daySession.subject.subjectCode}</div>
                              <div className="truncate">{daySession.teacher.fullName}</div>
                              <div className="text-xs opacity-75">{courses.find(c => c.id === daySession.courseId)?.courseCode}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-white">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Class Sessions List</h3>
          </div>
          <div>
            <div className="space-y-4">
              {filteredSessions.map(session => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer bg-white hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="px-3 py-1">{session.dayOfWeek}</Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{session.subject.subjectName}</h3>
                      <p className="text-gray-600 mb-3">{session.subject.subjectCode} • {session.subject.credits} credits</p>
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{session.teacher.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{courses.find(c => c.id === session.courseId)?.courseCode} - {courses.find(c => c.id === session.courseId)?.courseName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                        onClick={() => openViewModal(session)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                          onClick={() => openEditModal(session)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedSession(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-0 rounded-2xl">
          <DialogHeader className="pb-6 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              {isCreateModalOpen ? 'Create Class Session' : 'Edit Class Session'}
            </DialogTitle>
          </DialogHeader>
          
          <form className="space-y-6 py-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject *</Label>
                  <Select value={formData.subjectId} onValueChange={(value) => setFormData({...formData, subjectId: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subjectCode} - {subject.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="teacher" className="text-sm font-medium text-gray-700">Instructor *</Label>
                  <Select value={formData.teacherId} onValueChange={(value) => setFormData({...formData, teacherId: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.fullName} ({teacher.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-sm font-medium text-gray-700">Course *</Label>
                  <Select value={formData.courseId} onValueChange={(value) => setFormData({...formData, courseId: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.courseCode} - {course.courseName} (Cap: {course.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek" className="text-sm font-medium text-gray-700">Day of Week *</Label>
                  <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData({...formData, dayOfWeek: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      {daysOfWeek.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Schedule Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                Schedule Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">Start Time *</Label>
                  <Select value={formData.startTime} onValueChange={(value) => setFormData({...formData, startTime: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">End Time *</Label>
                  <Select value={formData.endTime} onValueChange={(value) => setFormData({...formData, endTime: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Academic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="academicYear" className="text-sm font-medium text-gray-700">Academic Year *</Label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={(value) => setFormData({...formData, academicYear: value})}
                  >
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      {getDynamicAcademicYearOptions().map((year) => (
                        <SelectItem key={year.id} value={year.year}>
                          {year.year} {year.isCurrent && '(Current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="term" className="text-sm font-medium text-gray-700">Term (Optional)</Label>
                  <Select value={formData.term} onValueChange={(value) => setFormData({...formData, term: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200">
                      <SelectItem value="none">No Term</SelectItem>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>
          
          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 bg-gray-50/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
              className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-lg font-medium transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={isCreateModalOpen ? handleCreateSession : handleEditSession}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              {isCreateModalOpen ? 'Create Session' : 'Update Session'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <p className="text-sm text-gray-600">
                  {selectedSession?.subject?.subjectCode} - {selectedSession?.subject?.subjectName}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Instructor</Label>
                <p className="text-sm text-gray-600">
                  {selectedSession?.teacher?.fullName} ({selectedSession?.teacher?.department})
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <p className="text-sm text-gray-600">
                  {courses.find(c => c.id === selectedSession?.courseId)?.courseCode} - {courses.find(c => c.id === selectedSession?.courseId)?.courseName}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <p className="text-sm text-gray-600">{selectedSession?.dayOfWeek}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <p className="text-sm text-gray-600">
                  {selectedSession?.startTime ? new Date(selectedSession.startTime).toLocaleString() : 'N/A'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>End Time</Label>
                <p className="text-sm text-gray-600">
                  {selectedSession?.endTime ? new Date(selectedSession.endTime).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <p className="text-sm text-gray-600">{selectedSession?.academicYear}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Term</Label>
                <p className="text-sm text-gray-600">{selectedSession?.term || 'No Term'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog></div>
  );
}

export default function TimetablePage() {
  return (
    <AdminLayoutNew 
      title="Timetable Management" 
      description="Manage class schedules and timetables"
    >
      <TimetablePageContent />
    </AdminLayoutNew>
  );
}