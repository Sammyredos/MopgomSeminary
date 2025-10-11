'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew'
import { StatsGrid, StatsCard } from '@/components/ui/stats-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Award,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  Calendar,
  GraduationCap,
  BarChart3,
  FileText
} from 'lucide-react'

interface Grade {
  id: string
  gradeValue: number
  maxGrade: number
  gradeType: string
  description?: string
  gradedAt: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    studentId: string
    fullName: string
    grade: string
    academicYear: string
  }
  subject: {
    id: string
    name: string
    code: string
  }
  teacher: {
    id: string
    teacherId: string
    fullName: string
  }
}

interface GradeStats {
  totalGrades: number
  averageGrade: number
  gradeTypeBreakdown: Record<string, { count: number; total: number; average: number }>
  gradeDistribution: {
    A: number
    B: number
    C: number
    D: number
    F: number
  }
}

interface Student {
  id: string
  studentId: string
  fullName: string
  grade: string
  academicYear: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Teacher {
  id: string
  teacherId: string
  fullName: string
}

interface CreateGradeData {
  studentId: string
  subjectId: string
  teacherId: string
  gradeValue: number
  maxGrade: number
  gradeType: string
  description?: string
  gradedAt?: string
}

const GRADE_TYPES = [
  'Assignment',
  'Quiz', 
  'Exam',
  'Project',
  'Participation',
  'Homework',
  'Test',
  'Final'
]

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [stats, setStats] = useState<GradeStats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [gradeTypeFilter, setGradeTypeFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [formData, setFormData] = useState<CreateGradeData>({
    studentId: '',
    subjectId: '',
    teacherId: '',
    gradeValue: 0,
    maxGrade: 100,
    gradeType: 'Assignment',
    description: '',
    gradedAt: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { currentUser } = useUser()
  const { success: showSuccess, error: showError } = useToast()

  // Permission checks
  const permissions = useMemo(() => {
    const userRole = currentUser?.role?.name || ''
    return {
      canCreate: ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Instructor'].includes(userRole),
    canEdit: ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Instructor'].includes(userRole),
    canDelete: ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager'].includes(userRole),
    canView: ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Instructor', 'Librarian', 'Parent', 'Student'].includes(userRole),
    canExport: ['Super Admin', 'Principal', 'Admin', 'Department Head', 'Manager', 'Instructor'].includes(userRole)
    }
  }, [currentUser?.role?.name])

  // Fetch grades data
  const fetchGrades = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        includeStats: 'true'
      })
      
      if (studentFilter) params.append('studentId', studentFilter)
      if (subjectFilter) params.append('subjectId', subjectFilter)
      if (gradeTypeFilter) params.append('gradeType', gradeTypeFilter)
      if (teacherFilter) params.append('teacherId', teacherFilter)

      // Helper function to get auth headers
      const getAuthHeaders = () => {
        const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      };

      const response = await fetch(`/api/admin/grades?${params}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        showError('Failed to fetch grades')
        return
      }
      
      const data = await response.json()

      if (data.success) {
        setGrades(data.grades)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      } else {
        showError('Failed to fetch grades')
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
      showError('Failed to fetch grades')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, studentFilter, subjectFilter, gradeTypeFilter, teacherFilter, showError])

  // Fetch supporting data
  const fetchSupportingData = useCallback(async () => {
    try {
      // Helper function to get auth headers
      const getAuthHeaders = () => {
        const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      };

      const [studentsRes, subjectsRes, teachersRes] = await Promise.all([
        fetch('/api/admin/students?limit=1000', { headers: getAuthHeaders() }),
        fetch('/api/admin/subjects?limit=1000', { headers: getAuthHeaders() }),
        fetch('/api/admin/teachers?limit=1000', { headers: getAuthHeaders() })
      ])

      // Check if responses are ok before parsing JSON
      const studentsData = studentsRes.ok ? await studentsRes.json() : { success: false }
      const subjectsData = subjectsRes.ok ? await subjectsRes.json() : { success: false }
      const teachersData = teachersRes.ok ? await teachersRes.json() : { success: false }

      if (studentsData.success) setStudents(studentsData.students || [])
      if (subjectsData.success) setSubjects(subjectsData.subjects || [])
      if (teachersData.success) setTeachers(teachersData.teachers || [])
    } catch (error) {
      console.error('Error fetching supporting data:', error)
    }
  }, [])

  useEffect(() => {
    fetchGrades()
  }, [fetchGrades])

  useEffect(() => {
    fetchSupportingData()
  }, [fetchSupportingData])

  // Filter grades
  const filteredGrades = useMemo(() => {
    return grades.filter(grade => {
      const matchesSearch = 
        grade.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Apply filters
      if (studentFilter && studentFilter !== 'all' && grade.student.id !== studentFilter) return false
      if (subjectFilter && subjectFilter !== 'all' && grade.subject.id !== subjectFilter) return false
      if (gradeTypeFilter && gradeTypeFilter !== 'all' && grade.gradeType !== gradeTypeFilter) return false
      if (teacherFilter && teacherFilter !== 'all' && grade.teacher.id !== teacherFilter) return false
      
      return matchesSearch
    })
  }, [grades, searchTerm, studentFilter, subjectFilter, gradeTypeFilter, teacherFilter])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = '/api/admin/grades'
      const method = showEditModal ? 'PUT' : 'POST'
      const payload = showEditModal ? { id: selectedGrade?.id, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        showSuccess(data.message)
        setShowCreateModal(false)
        setShowEditModal(false)
        resetForm()
        fetchGrades()
      } else {
        showError(data.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      showError('Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedGrade) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/grades?id=${selectedGrade.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showSuccess(data.message)
        setShowDeleteModal(false)
        setSelectedGrade(null)
        fetchGrades()
      } else {
        showError(data.error || 'Failed to delete grade')
      }
    } catch (error) {
      console.error('Error deleting grade:', error)
      showError('Failed to delete grade')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      studentId: '',
      subjectId: '',
      teacherId: currentUser?.id || '',
      gradeValue: 0,
      maxGrade: 100,
      gradeType: 'Assignment',
      description: '',
      gradedAt: new Date().toISOString().split('T')[0]
    })
  }

  // Open edit modal
  const openEditModal = (grade: Grade) => {
    setSelectedGrade(grade)
    setFormData({
      studentId: grade.student.id,
      subjectId: grade.subject.id,
      teacherId: grade.teacher.id,
      gradeValue: grade.gradeValue,
      maxGrade: grade.maxGrade,
      gradeType: grade.gradeType,
      description: grade.description || '',
      gradedAt: grade.gradedAt.split('T')[0]
    })
    setShowEditModal(true)
  }

  // Get grade letter
  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  // Get grade color
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100'
    if (percentage >= 80) return 'text-blue-600 bg-blue-100'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100'
    if (percentage >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  // Check permissions
  if (!permissions.canView) {
    return (
      <AdminLayoutNew title="Grade Book" description="Manage student grades and assessments">
        <div className="text-center py-12" suppressHydrationWarning={true}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </AdminLayoutNew>
    )
  }

  return (
    <AdminLayoutNew title="Grade Book" description="Manage student grades and assessments">
      <div className="space-y-6 px-6">
        {/* Stats Cards */}
        {stats && (
        <StatsGrid columns={4}>
          <StatsCard
            title="Total Grades"
            value={stats.totalGrades}
            subtitle="All recorded grades"
            icon={Award}
            gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
            bgGradient="bg-gradient-to-br from-white to-blue-50"
          />
          <StatsCard
            title="Class Average"
            value={`${stats.averageGrade.toFixed(1)}%`}
            subtitle="Overall performance"
            icon={TrendingUp}
            gradient="bg-gradient-to-r from-green-500 to-emerald-600"
            bgGradient="bg-gradient-to-br from-white to-green-50"
          />
          <StatsCard
            title="A Grades"
            value={stats.gradeDistribution.A}
            subtitle="90% and above"
            icon={GraduationCap}
            gradient="bg-gradient-to-r from-orange-500 to-amber-600"
            bgGradient="bg-gradient-to-br from-white to-orange-50"
          />
          <StatsCard
            title="Grade Types"
            value={Object.keys(stats.gradeTypeBreakdown).length}
            subtitle="Assessment categories"
            icon={BarChart3}
            gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
            bgGradient="bg-gradient-to-br from-white to-purple-50"
          />
        </StatsGrid>
      )}

      {/* Controls */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search grades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={gradeTypeFilter} onValueChange={setGradeTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {GRADE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {permissions.canExport && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {permissions.canCreate && (
              <Button
                onClick={() => {
                  resetForm()
                  setShowCreateModal(true)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grades Table */}
      {isLoading ? (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </Card>
      ) : filteredGrades.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Grades Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || studentFilter || subjectFilter || gradeTypeFilter
              ? 'No grades match your current filters.'
              : 'No grades have been recorded yet.'}
          </p>
          {permissions.canCreate && !searchTerm && !studentFilter && !subjectFilter && !gradeTypeFilter && (
            <Button
              onClick={() => {
                resetForm()
                setShowCreateModal(true)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record First Grade
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Subject</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Grade</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Instructor</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((grade) => {
                  const percentage = (grade.gradeValue / grade.maxGrade) * 100
                  const gradeLetter = getGradeLetter(percentage)
                  const gradeColor = getGradeColor(percentage)
                  
                  return (
                    <tr key={grade.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{grade.student.fullName}</p>
                          <p className="text-sm text-gray-500">{grade.student.studentId}</p>
                          <p className="text-sm text-gray-500">Grade {grade.student.grade}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{grade.subject.name}</p>
                          <p className="text-sm text-gray-500">{grade.subject.code}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Badge className={gradeColor}>
                            {gradeLetter}
                          </Badge>
                          <span className="font-medium">
                            {grade.gradeValue}/{grade.maxGrade}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        {grade.description && (
                          <p className="text-sm text-gray-500 mt-1">{grade.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{grade.gradeType}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{grade.teacher.fullName}</p>
                          <p className="text-sm text-gray-500">{grade.teacher.teacherId}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">
                          {new Date(grade.gradedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          {permissions.canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(grade)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedGrade(grade)
                                setShowDeleteModal(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? 'Edit Grade' : 'Record New Grade'}
            </DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update grade information.' : 'Record a new grade for a student.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <Select
                value={formData.studentId}
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} ({student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade *
                </label>
                <Input
                  type="number"
                  value={formData.gradeValue}
                  onChange={(e) => setFormData({ ...formData, gradeValue: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max={formData.maxGrade}
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Grade *
                </label>
                <Input
                  type="number"
                  value={formData.maxGrade}
                  onChange={(e) => setFormData({ ...formData, maxGrade: parseFloat(e.target.value) || 100 })}
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Type *
              </label>
              <Select
                value={formData.gradeType}
                onValueChange={(value) => setFormData({ ...formData, gradeType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description or notes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Graded *
              </label>
              <Input
                type="date"
                value={formData.gradedAt}
                onChange={(e) => setFormData({ ...formData, gradedAt: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : showEditModal ? 'Update' : 'Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grade for <strong>{selectedGrade?.student.fullName}</strong> in <strong>{selectedGrade?.subject.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayoutNew>
  )
}