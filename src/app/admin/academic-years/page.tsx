'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Search,
  Filter,
  Plus,
  GraduationCap,
  BookOpen,
  Users,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Zap,
  Clock,
  Globe,
} from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  semesters: Semester[];
  _count: {
    students: number;
    calendarEvents: number;
  };
}

interface Semester {
  id: string;
  name: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  academicYearId: string;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsData {
  totalAcademicYears: number;
  activeAcademicYears: number;
  currentAcademicYear: AcademicYear | null;
  totalStudents: number;
  totalSemesters: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 10;

export default function AcademicYearsPage() {
  const { currentUser } = useUser();
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list view
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalAcademicYears: 0,
    activeAcademicYears: 0,
    currentAcademicYear: null,
    totalStudents: 0,
    totalSemesters: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [unconventionalCalendar, setUnconventionalCalendar] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [generatingYears, setGeneratingYears] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    year: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
    isCurrent: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Permission checks
  const canCreate = ['Super Admin', 'Principal', 'Admin'].includes(currentUser?.role?.name || '');
  const canGenerate = ['Super Admin', 'Principal'].includes(currentUser?.role?.name || '');
  const canEdit = ['Super Admin', 'Principal', 'Admin'].includes(currentUser?.role?.name || '');
  const canDelete = ['Super Admin', 'Principal'].includes(currentUser?.role?.name || '');
  const canView = ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'].includes(currentUser?.role?.name || '');

  // Check authentication
  useEffect(() => {
    if (!currentUser) {
      router.push('/admin/login');
      return;
    }
    if (!canView) {
      toast.error('You do not have permission to access this page');
      router.push('/admin/dashboard');
      return;
    }
  }, [currentUser, router, canView]);

  useEffect(() => {
    if (currentUser && canView) {
      fetchAcademicYears();
      fetchAnalytics();
    }
  }, [pagination.page, searchTerm, statusFilter, currentUser, canView]);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/academic-years?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch academic years');
      }

      const data = await response.json();
      setAcademicYears(data.academicYears);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/academic-years/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const resetForm = () => {
    setFormData({
      year: '',
      startDate: '',
      endDate: '',
      description: '',
      isActive: true,
      isCurrent: false,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.year.trim()) {
      errors.year = 'Academic year is required';
    } else if (!/^\d{4}(-\d{4})?$/.test(formData.year.trim())) {
      errors.year = 'Academic year must be in format YYYY or YYYY-YYYY (e.g., 2024 or 2024-2025)';
    } else {
      // Additional validation for cross-year format
      const yearParts = formData.year.trim().split('-');
      if (yearParts.length === 2) {
        const startYear = parseInt(yearParts[0]);
        const endYear = parseInt(yearParts[1]);
        if (endYear <= startYear) {
          errors.year = 'In YYYY-YYYY format, the second year must be greater than the first';
        }
      }
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        errors.endDate = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAcademicYear = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create academic year');
      }

      toast.success('Academic year created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchAcademicYears();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error creating academic year:', error);
      toast.error(error.message || 'Failed to create academic year');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAcademicYear = async () => {
    if (!selectedAcademicYear || !validateForm()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/academic-years/${selectedAcademicYear.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update academic year');
      }

      toast.success('Academic year updated successfully');
      setShowEditModal(false);
      resetForm();
      setSelectedAcademicYear(null);
      fetchAcademicYears();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error updating academic year:', error);
      toast.error(error.message || 'Failed to update academic year');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAcademicYear = async () => {
    if (!selectedAcademicYear) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/academic-years/${selectedAcademicYear.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete academic year');
      }

      toast.success('Academic year deleted successfully');
      setShowDeleteModal(false);
      setSelectedAcademicYear(null);
      fetchAcademicYears();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error deleting academic year:', error);
      toast.error(error.message || 'Failed to delete academic year');
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic generation functions
  const handleAutoGenerateYears = async () => {
    try {
      setGeneratingYears(true);
      const response = await fetch('/api/unconventional-calendar?action=auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to auto-generate academic years');
      }

      const data = await response.json();
      toast.success(data.message || 'Academic years generated successfully');
      fetchAcademicYears();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error auto-generating years:', error);
      toast.error(error.message || 'Failed to auto-generate academic years');
    } finally {
      setGeneratingYears(false);
    }
  };

  const handleGenerateCustomYears = async (startYear: number, count: number) => {
    try {
      setGeneratingYears(true);
      const response = await fetch('/api/unconventional-calendar?action=generate-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startYear, count }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate academic years');
      }

      const data = await response.json();
      toast.success(data.message || 'Academic years generated successfully');
      fetchAcademicYears();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error generating years:', error);
      toast.error(error.message || 'Failed to generate academic years');
    } finally {
      setGeneratingYears(false);
    }
  };

  // Unconventional calendar functions
  const fetchUnconventionalCalendar = async () => {
    try {
      const response = await fetch('/api/unconventional-calendar?action=current-date');
      if (!response.ok) throw new Error('Failed to fetch unconventional calendar');
      
      const data = await response.json();
      setUnconventionalCalendar(data.currentDate);
    } catch (error: any) {
      console.error('Error fetching unconventional calendar:', error);
    }
  };

  const fetchCalendarEvents = async (year: number) => {
    try {
      const response = await fetch(`/api/unconventional-calendar?action=calendar-events&year=${year}`);
      if (!response.ok) throw new Error('Failed to fetch calendar events');
      
      const data = await response.json();
      setCalendarEvents(data.events || []);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const openCalendarModal = async () => {
    setShowCalendarModal(true);
    await fetchUnconventionalCalendar();
    if (unconventionalCalendar?.unconventional?.year) {
      await fetchCalendarEvents(unconventionalCalendar.unconventional.year);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (academicYear: AcademicYear) => {
    setSelectedAcademicYear(academicYear);
    setFormData({
      year: academicYear.year,
      startDate: academicYear.startDate.split('T')[0],
      endDate: academicYear.endDate.split('T')[0],
      description: academicYear.description || '',
      isActive: academicYear.isActive,
      isCurrent: academicYear.isCurrent,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (academicYear: AcademicYear) => {
    setSelectedAcademicYear(academicYear);
    setShowViewModal(true);
  };

  const openDeleteModal = (academicYear: AcademicYear) => {
    setSelectedAcademicYear(academicYear);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  if (loading && academicYears.length === 0) {
    return (
      <AdminLayoutNew title="Academic Year Management" description="Manage academic years and semester structure">
        <div className="space-y-6">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayoutNew>
    );
  }

  return (
    <AdminLayoutNew title="Academic Year Management" description="Manage academic years and semester structure">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Academic Years</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalAcademicYears}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Years</p>
              <p className="text-3xl font-bold text-green-600">{analyticsData.activeAcademicYears}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CalendarDays className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Year</p>
              <p className="text-lg font-bold text-purple-600">
                {analyticsData.currentAcademicYear?.year || 'None Set'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-orange-600">{analyticsData.totalStudents}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Semesters</p>
              <p className="text-3xl font-bold text-indigo-600">{analyticsData.totalSemesters}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search academic years..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="flex items-center gap-2"
                >
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outline"
                onClick={openCalendarModal}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Unconventional Calendar
              </Button>
              {canGenerate && (
                <Button
                  variant="outline"
                  onClick={handleAutoGenerateYears}
                  disabled={generatingYears}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {generatingYears ? 'Generating...' : 'Auto Generate'}
                </Button>
              )}
              {canCreate && (
                <Button onClick={openCreateModal} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Academic Year
                </Button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="mt-4 flex justify-end">
            <ViewToggle 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Academic Years Table */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Years</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : academicYears.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Academic Years Found</h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters
                  ? 'No academic years match your current filters.'
                  : 'Get started by creating your first academic year.'}
              </p>
              {canCreate && !hasActiveFilters && (
                <Button onClick={openCreateModal} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Add Academic Year
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'list' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Semesters</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYears.map((academicYear) => (
                      <TableRow key={academicYear.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{academicYear.year}</div>
                            {academicYear.description && (
                              <div className="text-sm text-gray-500">{academicYear.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(academicYear.startDate)}</div>
                            <div className="text-gray-500">to {formatDate(academicYear.endDate)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant={academicYear.isActive ? 'default' : 'secondary'}>
                              {academicYear.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {academicYear.isCurrent && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Current
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{academicYear.semesters.length} semesters</div>
                            <div className="text-gray-500">
                              {academicYear.semesters.filter(s => s.isActive).length} active
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{academicYear._count.students}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{academicYear._count.calendarEvents}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(academicYear)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(academicYear)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(academicYear)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {academicYears.map((academicYear) => (
                    <Card key={academicYear.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{academicYear.year}</CardTitle>
                            {academicYear.description && (
                              <p className="text-sm text-gray-500 mt-1">{academicYear.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge variant={academicYear.isActive ? 'default' : 'secondary'}>
                              {academicYear.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {academicYear.isCurrent && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Duration:</span>
                            <span>{formatDate(academicYear.startDate)} - {formatDate(academicYear.endDate)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span>{academicYear.semesters.length} Semesters</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{academicYear._count.students} Students</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <span>{academicYear._count.calendarEvents} Events</span>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(academicYear)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(academicYear)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(academicYear)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Academic Year</DialogTitle>
            <DialogDescription>
              Add a new academic year with three semesters structure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year">Academic Year *</Label>
              <Input
                id="year"
                placeholder="e.g., 2024-2025"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className={formErrors.year ? 'border-red-500' : ''}
              />
              {formErrors.year && <p className="text-sm text-red-500">{formErrors.year}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={formErrors.startDate ? 'border-red-500' : ''}
                />
                {formErrors.startDate && (
                <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-200 text-xs font-normal">
                  {formErrors.startDate}
                </Badge>
              )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={formErrors.endDate ? 'border-red-500' : ''}
                />
                {formErrors.endDate && (
                <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-200 text-xs font-normal">
                  {formErrors.endDate}
                </Badge>
              )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this academic year"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isCurrent"
                checked={formData.isCurrent}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isCurrent">Set as Current Academic Year</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAcademicYear} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Academic Year'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>
              Update the academic year information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editYear">Academic Year *</Label>
              <Input
                id="editYear"
                placeholder="e.g., 2024-2025"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className={formErrors.year ? 'border-red-500' : ''}
              />
              {formErrors.year && <p className="text-sm text-red-500">{formErrors.year}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">Start Date *</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={formErrors.startDate ? 'border-red-500' : ''}
                />
                {formErrors.startDate && (
                  <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-200 text-xs font-normal">
                    {formErrors.startDate}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndDate">End Date *</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={formErrors.endDate ? 'border-red-500' : ''}
                />
                {formErrors.endDate && (
                  <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-200 text-xs font-normal">
                    {formErrors.endDate}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Optional description for this academic year"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="editIsActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsCurrent"
                checked={formData.isCurrent}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="editIsCurrent">Set as Current Academic Year</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAcademicYear} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Academic Year'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Academic Year Details</DialogTitle>
          </DialogHeader>
          {selectedAcademicYear && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Academic Year</Label>
                  <p className="font-semibold text-lg">{selectedAcademicYear.year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={selectedAcademicYear.isActive ? 'default' : 'secondary'}>
                      {selectedAcademicYear.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedAcademicYear.isCurrent && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                  <p className="font-semibold">{formatDate(selectedAcademicYear.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">End Date</Label>
                  <p className="font-semibold">{formatDate(selectedAcademicYear.endDate)}</p>
                </div>
              </div>
              {selectedAcademicYear.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="mt-1">{selectedAcademicYear.description}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Semesters</Label>
                  <p className="font-semibold text-lg">{selectedAcademicYear.semesters.length}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAcademicYear.semesters.filter(s => s.isActive).length} active
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Students</Label>
                  <p className="font-semibold text-lg">{selectedAcademicYear._count.students}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Calendar Events</Label>
                  <p className="font-semibold text-lg">{selectedAcademicYear._count.calendarEvents}</p>
                </div>
              </div>
              {selectedAcademicYear.semesters.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-3 block">Semesters</Label>
                  <div className="space-y-2">
                    {selectedAcademicYear.semesters.map((semester) => (
                      <div key={semester.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{semester.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                          </p>
                        </div>
                        <Badge variant={semester.isActive ? 'default' : 'secondary'}>
                          {semester.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p>{formatDate(selectedAcademicYear.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p>{formatDate(selectedAcademicYear.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Academic Year</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this academic year? This action cannot be undone and will affect all related records.
            </DialogDescription>
          </DialogHeader>
          {selectedAcademicYear && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="font-medium text-red-900">{selectedAcademicYear.year}</p>
                <p className="text-sm text-red-700">
                  {formatDate(selectedAcademicYear.startDate)} - {formatDate(selectedAcademicYear.endDate)}
                </p>
                <div className="mt-2 text-sm text-red-700">
                  <p>• {selectedAcademicYear._count.students} students will be affected</p>
                  <p>• {selectedAcademicYear._count.calendarEvents} calendar events will be deleted</p>
                  <p>• {selectedAcademicYear.semesters.length} semesters will be deleted</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAcademicYear} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Academic Year'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unconventional Calendar Modal */}
      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Unconventional Calendar System
            </DialogTitle>
            <DialogDescription>
              View the current date and events in our 13-month, 28-day unconventional calendar system.
            </DialogDescription>
          </DialogHeader>
          
          {unconventionalCalendar && (
            <div className="space-y-6">
              {/* Current Date Display */}
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Current Date</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Standard:</span>
                        <span>{new Date(unconventionalCalendar.standard).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Unconventional:</span>
                        <span className="text-purple-600 font-semibold">
                          {unconventionalCalendar.unconventional.formatted}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Academic Year:</span>
                        <span className="text-green-600 font-semibold">
                          {unconventionalCalendar.unconventional.academicYear}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Calendar Structure</h3>
                    <div className="space-y-1 text-sm">
                      <div>• 13 months per year</div>
                      <div>• 28 days per month</div>
                      <div>• 8-day weeks</div>
                      <div>• 3 semesters per academic year</div>
                      <div>• Custom seasonal adjustments</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Calendar Events */}
              {calendarEvents.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Calendar Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {calendarEvents.map((event, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          event.type === 'holiday'
                            ? 'bg-red-50 border-red-200'
                            : event.type === 'seasonal'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="font-medium text-sm">{event.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {event.date.formatted}
                        </div>
                        {event.description && (
                          <div className="text-xs text-gray-500 mt-2">
                            {event.description}
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className={`mt-2 text-xs ${
                            event.type === 'holiday'
                              ? 'border-red-300 text-red-700'
                              : event.type === 'seasonal'
                              ? 'border-orange-300 text-orange-700'
                              : 'border-blue-300 text-blue-700'
                          }`}
                        >
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Week Structure */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4">8-Day Week Structure</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {['Primday', 'Secunday', 'Tertiday', 'Quartday', 'Quintday', 'Sextday', 'Septday', 'Octday'].map((day, index) => (
                    <div key={index} className="text-center p-2 bg-gray-100 rounded text-sm font-medium">
                      {day}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Month Names */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4">13-Month Calendar</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {['Primarius', 'Secundus', 'Tertius', 'Quartus', 'Quintus', 'Sextus', 'Septimus', 'Octavus', 'Nonus', 'Decimus', 'Undecimus', 'Duodecimus', 'Tredecimus'].map((month, index) => (
                    <div key={index} className="text-center p-2 bg-purple-100 rounded text-sm font-medium">
                      {index + 1}. {month}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowCalendarModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayoutNew>
  );
}