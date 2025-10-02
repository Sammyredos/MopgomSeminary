'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BookOpen, Users, GraduationCap, Plus, Search, Filter, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { useAcademicYear } from '@/hooks/useAcademicYear';
import { getDynamicAcademicYearOptions } from '@/lib/utils/dynamic-years';

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Semester {
  id: string;
  semesterNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
  isCurrent: boolean;
  academicYearId: string;
  academicYear: AcademicYear;
  createdAt: string;
  updatedAt: string;
  _count: {
    courseOfferings: number;
    enrollments: number;
    grades: number;
  };
}

interface AnalyticsData {
  totalSemesters: number;
  activeSemesters: number;
  currentSemester: number;
  totalEnrollments: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SemestersPage() {
  const { currentUser } = useUser();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  // Use shared academic year hook
  const { academicYears, isLoading: academicYearLoading } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSemesters: 0,
    activeSemesters: 0,
    currentSemester: 0,
    totalEnrollments: 0,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSemesterData, setSelectedSemesterData] = useState<Semester | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    semesterNumber: 1,
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
    isCurrent: false,
    academicYearId: '',
  });

  const canManage = currentUser?.role?.name && ['Super Admin', 'Principal', 'Admin'].includes(currentUser.role.name);
  const canDelete = currentUser?.role?.name && ['Super Admin', 'Principal'].includes(currentUser.role.name);

  useEffect(() => {
    fetchSemesters();
    // Academic years are automatically fetched by the shared hook
    fetchAnalytics();
  }, [pagination.page, pagination.limit, searchTerm, selectedAcademicYear, selectedSemester, statusFilter]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        academicYear: selectedAcademicYear,
        semester: selectedSemester,
        status: statusFilter,
      });

      const response = await fetch(`/api/semesters?${params}`);
      if (!response.ok) throw new Error('Failed to fetch semesters');
      
      const data = await response.json();
      setSemesters(data.semesters);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  };

  // Academic years are now managed by the shared hook

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/semesters/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleCreateSemester = async () => {
    try {
      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create semester');
      }

      toast.success('Semester created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchSemesters();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error creating semester:', error);
      toast.error(error.message || 'Failed to create semester');
    }
  };

  const handleUpdateSemester = async () => {
    if (!selectedSemesterData) return;

    try {
      const response = await fetch(`/api/semesters/${selectedSemesterData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update semester');
      }

      toast.success('Semester updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchSemesters();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error updating semester:', error);
      toast.error(error.message || 'Failed to update semester');
    }
  };

  const handleDeleteSemester = async () => {
    if (!selectedSemesterData) return;

    try {
      const response = await fetch(`/api/semesters/${selectedSemesterData.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete semester');
      }

      toast.success('Semester deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedSemesterData(null);
      fetchSemesters();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error deleting semester:', error);
      toast.error(error.message || 'Failed to delete semester');
    }
  };

  const resetForm = () => {
    setFormData({
      semesterNumber: 1,
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      isActive: true,
      isCurrent: false,
      academicYearId: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (semester: Semester) => {
    setSelectedSemesterData(semester);
    setFormData({
      semesterNumber: semester.semesterNumber,
      name: semester.name,
      startDate: semester.startDate.split('T')[0],
      endDate: semester.endDate.split('T')[0],
      description: semester.description || '',
      isActive: semester.isActive,
      isCurrent: semester.isCurrent,
      academicYearId: semester.academicYearId,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (semester: Semester) => {
    setSelectedSemesterData(semester);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (semester: Semester) => {
    setSelectedSemesterData(semester);
    setIsDeleteModalOpen(true);
  };

  const getSemesterName = (number: number) => {
    const names = { 1: 'First Semester', 2: 'Second Semester', 3: 'Third Semester' };
    return names[number as keyof typeof names] || `Semester ${number}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayoutNew>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Semester Management</h1>
            <p className="text-muted-foreground">
              Manage academic semesters and their three-semester structure
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreateModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Semester
            </Button>
          )}
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Semesters</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSemesters}</div>
              <p className="text-xs text-muted-foreground">
                Across all academic years
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Semesters</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeSemesters}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Semester</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.currentSemester}</div>
              <p className="text-xs text-muted-foreground">
                In session now
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
              <p className="text-xs text-muted-foreground">
                Student enrollments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search semesters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic-year">Academic Year</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Academic Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester Number</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="1">First Semester</SelectItem>
                    <SelectItem value="2">Second Semester</SelectItem>
                    <SelectItem value="3">Third Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Per Page</Label>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semesters Table */}
        <Card>
          <CardHeader>
            <CardTitle>Semesters ({pagination.total})</CardTitle>
            <CardDescription>
              Manage academic semesters with their three-semester structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : semesters.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No semesters found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canManage ? 'Get started by creating a new semester.' : 'No semesters match your current filters.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {semesters.map((semester) => (
                    <Card key={semester.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {semester.semesterNumber}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {semester.name}
                              </h3>
                              {semester.isCurrent && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              <Badge variant={semester.isActive ? 'secondary' : 'outline'} className="text-xs">
                                {semester.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-sm text-muted-foreground">
                                {semester.academicYear.year}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {semester._count.enrollments} enrollments
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {semester._count.courseOfferings} courses
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {semester._count.grades} grades
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(semester)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(semester)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(semester)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <Button
                              key={pageNumber}
                              variant={pagination.page === pageNumber ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Semester Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Semester</DialogTitle>
              <DialogDescription>
                Add a new semester to the academic calendar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, academicYearId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDynamicAcademicYearOptions().map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semesterNumber">Semester Number</Label>
                <Select
                  value={formData.semesterNumber.toString()}
                  onValueChange={(value) => {
                    const number = parseInt(value);
                    setFormData(prev => ({ 
                      ...prev, 
                      semesterNumber: number,
                      name: getSemesterName(number)
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - First Semester</SelectItem>
                    <SelectItem value="2">2 - Second Semester</SelectItem>
                    <SelectItem value="3">3 - Third Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Semester Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., First Semester"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Semester description..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isCurrent"
                  checked={formData.isCurrent}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCurrent: checked }))}
                />
                <Label htmlFor="isCurrent">Set as Current Semester</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSemester}>
                Create Semester
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Semester Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Semester</DialogTitle>
              <DialogDescription>
                Update semester information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editAcademicYear">Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, academicYearId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDynamicAcademicYearOptions().map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSemesterNumber">Semester Number</Label>
                <Select
                  value={formData.semesterNumber.toString()}
                  onValueChange={(value) => {
                    const number = parseInt(value);
                    setFormData(prev => ({ 
                      ...prev, 
                      semesterNumber: number,
                      name: getSemesterName(number)
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - First Semester</SelectItem>
                    <SelectItem value="2">2 - Second Semester</SelectItem>
                    <SelectItem value="3">3 - Third Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editName">Semester Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., First Semester"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description (Optional)</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Semester description..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="editIsActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsCurrent"
                  checked={formData.isCurrent}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCurrent: checked }))}
                />
                <Label htmlFor="editIsCurrent">Set as Current Semester</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSemester}>
                Update Semester
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Semester Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Semester Details</DialogTitle>
              <DialogDescription>
                View detailed information about this semester.
              </DialogDescription>
            </DialogHeader>
            {selectedSemesterData && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Semester Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedSemesterData.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Semester Number</Label>
                      <p className="text-sm text-muted-foreground">{selectedSemesterData.semesterNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Academic Year</Label>
                      <p className="text-sm text-muted-foreground">{selectedSemesterData.academicYear.year}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex gap-2">
                        <Badge variant={selectedSemesterData.isActive ? 'secondary' : 'outline'}>
                          {selectedSemesterData.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {selectedSemesterData.isCurrent && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Start Date</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedSemesterData.startDate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">End Date</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedSemesterData.endDate)}</p>
                    </div>
                  </div>
                  {selectedSemesterData.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{selectedSemesterData.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Created At</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedSemesterData.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Updated At</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedSemesterData.updatedAt)}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="statistics" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Course Offerings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedSemesterData._count.courseOfferings}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Student Enrollments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedSemesterData._count.enrollments}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Grades Recorded</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedSemesterData._count.grades}</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Semester Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Semester
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this semester? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedSemesterData && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">{selectedSemesterData.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSemesterData.academicYear.year} - Semester {selectedSemesterData.semesterNumber}
                  </p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>• {selectedSemesterData._count.enrollments} student enrollments</p>
                    <p>• {selectedSemesterData._count.courseOfferings} course offerings</p>
                    <p>• {selectedSemesterData._count.grades} grades recorded</p>
                  </div>
                </div>
                {(selectedSemesterData._count.enrollments > 0 || 
                  selectedSemesterData._count.courseOfferings > 0 || 
                  selectedSemesterData._count.grades > 0) && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      ⚠️ This semester has associated data. Deleting it will also remove all related enrollments, course offerings, and grades.
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSemester}>
                Delete Semester
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayoutNew>
  );
}