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
  Users,
  Search,
  Filter,
  Plus,
  GraduationCap,
  BookOpen,
  Calendar,
  UserCheck,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { useAcademicYear } from '@/hooks/useAcademicYear';
import CreateStudentModal from '@/components/admin/CreateStudentModal';
import EditStudentModal from '@/components/admin/EditStudentModal';
import ViewStudentModal from '@/components/admin/ViewStudentModal';
import DeleteStudentModal from '@/components/admin/DeleteStudentModal';

interface Student {
  id: string;
  studentId: string;
  matricNumber?: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  grade: string;
  enrollmentDate: string;
  graduationYear?: number;
  currentClass?: string;
  isActive: boolean;
  academicYear: string;
  parentGuardianName?: string;
  parentGuardianPhone?: string;
  parentGuardianEmail?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  newThisMonth: number;
  averageAge: number;
  gradeDistribution: Record<string, number>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 10; // Changed to 10 items per page for list view
const GRADES = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
  isCurrent: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list view
  // Use shared academic year hook
  const { academicYears, isLoading: academicYearLoading } = useAcademicYear();
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalStudents: 0,
    activeStudents: 0,
    newThisMonth: 0,
    averageAge: 0,
    gradeDistribution: {},
  });
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Academic years are now managed by the shared hook

  const fetchStudents = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        grade: gradeFilter !== 'all' ? gradeFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
        academicYear: academicYearFilter !== 'all' ? academicYearFilter : '',
      });

      const response = await fetch(`/api/students?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.students);
      setPagination(data.pagination);
      setAnalyticsData(data.analytics);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Academic years are automatically fetched by the shared hook

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, searchTerm, gradeFilter, statusFilter, academicYearFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleGradeFilter = (value: string) => {
    setGradeFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAcademicYearFilter = (value: string) => {
    setAcademicYearFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleStudentCreated = () => {
    fetchStudents();
    setShowCreateModal(false);
  };

  const handleStudentUpdated = () => {
    fetchStudents();
    setShowEditModal(false);
  };

  const handleStudentDeleted = () => {
    fetchStudents();
    setShowDeleteModal(false);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGradeFilter('all');
    setStatusFilter('all');
    setAcademicYearFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = searchTerm || gradeFilter !== 'all' || statusFilter !== 'all' || academicYearFilter !== 'all';

  if (loading && students.length === 0) {
    return (
      <AdminLayoutNew title="Student Management" description="Manage student enrollment and academic records">
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
    <AdminLayoutNew title="Student Management" description="Manage student enrollment and academic records">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalStudents}</p>
              <p className="text-sm text-gray-500">All enrolled students</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.activeStudents}</p>
              <p className="text-sm text-gray-500">Currently enrolled</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.newThisMonth}</p>
              <p className="text-sm text-gray-500">Recent enrollments</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Age</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(analyticsData.averageAge)}</p>
              <p className="text-sm text-gray-500">Years old</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={gradeFilter} onValueChange={handleGradeFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={academicYearFilter} onValueChange={handleAcademicYearFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.year}>
                    {year.year} {year.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}

            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mt-4 flex justify-end">
          <ViewToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Showing filtered results
              {searchTerm && (
                <span> for "{searchTerm}"</span>
              )}
            </span>
          </div>
        )}
      </Card>

      {/* Students Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Students ({pagination.total})</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
              </p>
            </div>
            {refreshing && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <>
              {viewMode === 'list' ? (
                // List View (Table)
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Matric Number</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Grade</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Class</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Enrollment</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Parent Contact</th>
                        <th className="text-right py-3 px-4 font-medium text-sm text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{student.fullName}</p>
                                <p className="text-sm text-gray-500">{student.studentId}</p>
                                <p className="text-sm text-gray-500">{student.emailAddress}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-900">
                              {student.matricNumber || 'Not assigned'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">
                              Grade {student.grade}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-900">
                              {student.currentClass || 'Not assigned'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={student.isActive ? 'default' : 'secondary'}>
                              {student.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm text-gray-900">{formatDate(student.enrollmentDate)}</p>
                              <p className="text-sm text-gray-500">{student.academicYear}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm text-gray-900">{student.parentGuardianName || 'Not provided'}</p>
                              <p className="text-sm text-gray-500">{student.parentGuardianPhone || 'No phone'}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewStudent(student)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStudent(student)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {students.map((student) => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{student.fullName}</h3>
                            <p className="text-sm text-gray-500">{student.studentId}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Matric Number:</span>
                            <span className="text-sm text-gray-900">{student.matricNumber || 'Not assigned'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Grade:</span>
                            <Badge variant="outline">Grade {student.grade}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge variant={student.isActive ? 'default' : 'secondary'}>
                              {student.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Class:</span>
                            <span className="text-sm text-gray-900">{student.currentClass || 'Not assigned'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Enrolled:</span>
                            <span className="text-sm text-gray-900">{formatDate(student.enrollmentDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {pagination.total === 0 ? 'No Students Yet' : 'No Matching Students'}
              </h3>
              <p className="text-gray-600 mb-4">
                {pagination.total === 0
                  ? 'Start by adding your first student to the system.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {pagination.total === 0 && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Student
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateStudentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onStudentCreated={handleStudentCreated}
        />
      )}

      {showEditModal && selectedStudent && (
        <EditStudentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          student={selectedStudent}
          onStudentUpdated={handleStudentUpdated}
        />
      )}

      {showViewModal && selectedStudent && (
        <ViewStudentModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          student={selectedStudent}
        />
      )}

      {showDeleteModal && selectedStudent && (
        <DeleteStudentModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          student={selectedStudent}
          onStudentDeleted={handleStudentDeleted}
        />
      )}
    </AdminLayoutNew>
  );
}