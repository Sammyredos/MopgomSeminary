'use client'

import { useState, useEffect } from 'react'
import { CourseTabs, CourseTabContent } from '@/components/ui/course-tabs'
import { EmptyStates } from '@/components/ui/empty-state'
import { CourseList } from '@/components/admin/CourseList'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import { Badge } from '@/components/ui/badge'
import { StatsSkeleton } from '@/components/ui/skeleton'
import CreateCourseModal from '@/components/modals/CreateCourseModal'
import { ToastProvider } from '@/contexts/ToastContext'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew'
import { GraduationCap, Award, Filter, BookOpen, Users, TrendingUp, Star, Plus, Search, School, University } from 'lucide-react'

interface CourseStats {
  totalCourses: number
  activeCourses: number
  totalStudents: number
  averageRating: number
  programBreakdown: {
    'general-certificate': number
    'diploma-certificate': number
    'bachelors-degree': number
    'masters-degree': number
  }
}

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState('general-certificate')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Add refresh trigger state

  // Fetch course statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true)
        const response = await fetch('/api/admin/courses/stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStats(data.stats)
          }
        }
      } catch (error) {
        console.error('Error fetching course stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  // Sync activeTab with URL query param (?tab=...)
  useEffect(() => {
    // Initialize from URL on mount
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    const validTabs = ['general-certificate', 'diploma-certificate', 'bachelors-degree', 'masters-degree']
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }

    // Handle back/forward navigation
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const currentTab = params.get('tab')
      if (currentTab && validTabs.includes(currentTab)) {
        setActiveTab(currentTab)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)

    // Update URL without reloading the page
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    window.history.pushState({}, '', url.toString())
  }

  // Course of Study tabs (updated with real data)
  const tabs = [
    {
      id: 'general-certificate',
      label: 'General Certificate',
      count: stats?.programBreakdown['general-certificate'] || 0,
      icon: Award
    },
    {
      id: 'diploma-certificate',
      label: 'Diploma Certificate',
      count: stats?.programBreakdown['diploma-certificate'] || 0,
      icon: Award
    },
    {
      id: 'bachelors-degree',
      label: "Bachelor's Degree",
      count: stats?.programBreakdown['bachelors-degree'] || 0,
      icon: School
    },
    {
      id: 'masters-degree',
      label: "Master's Degree",
      count: stats?.programBreakdown['masters-degree'] || 0,
      icon: University
    }
  ]

  const handleAddCourse = () => {
    setIsCreateModalOpen(true)
  }

  const handleCourseCreated = (newCourse: any) => {
    setCourses(prev => [...prev, newCourse])
    // Trigger CourseList refresh by incrementing refreshTrigger
    setRefreshTrigger(prev => prev + 1)
    // Refresh stats asynchronously to avoid blocking the UI
    setTimeout(() => {
      refreshStats()
    }, 100)
  }

  const handleCourseUpdated = (updatedCourse: any) => {
    if (!updatedCourse) return;
    
    // Determine which tab the updated course should belong to
    const subjectArea = updatedCourse.subjectArea?.toLowerCase() || ''
    let targetTab = activeTab

    if (subjectArea === 'general certificate' || 
        (subjectArea.includes('general') && subjectArea.includes('certificate') && !subjectArea.includes('diploma'))) {
      targetTab = 'general-certificate'
    } else if (subjectArea === 'diploma certificate' || 
               (subjectArea.includes('diploma') && subjectArea.includes('certificate'))) {
      targetTab = 'diploma-certificate'
    } else if (subjectArea === "bachelor's degree" || 
               subjectArea.includes('bachelor') || 
               subjectArea.includes('undergraduate')) {
      targetTab = 'bachelors-degree'
    } else if (subjectArea === "master's degree" || 
               subjectArea.includes('master') || 
               subjectArea.includes('graduate')) {
      targetTab = 'masters-degree'
    }

    // Use a single state update to prevent multiple re-renders
    const needsTabSwitch = targetTab !== activeTab
    
    if (needsTabSwitch) {
      console.log(`Course moved from ${activeTab} to ${targetTab}, switching tabs...`)
      setActiveTab(targetTab)
    }

    // Trigger refresh for all tabs (this will cause CourseList to refetch)
    setRefreshTrigger(prev => prev + 1)
    
    // Refresh stats asynchronously to avoid blocking the UI
    setTimeout(() => {
      refreshStats()
    }, 100)
  }

  const refreshStats = async () => {
    try {
      const response = await fetch('/api/admin/courses/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Error refreshing course stats:', error)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Super Admin', 'Admin', 'Manager', 'Staff']}>
      <AdminLayoutNew title="Course Management" description="Manage courses across different programs and study levels">
        <ToastProvider>
          <div className="space-y-6 px-6 py-8" suppressHydrationWarning>
            {/* Stats Cards */}
            {isLoadingStats ? (
              <StatsSkeleton />
            ) : (
              <StatsGrid columns={4}>
                <StatsCard
                  title="Total Courses"
                  value={stats?.totalCourses || 0}
                  subtitle="All available courses"
                  icon={BookOpen}
                  gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
                  bgGradient="bg-gradient-to-br from-white to-blue-50"
                />

                <StatsCard
                  title="Active Courses"
                  value={stats?.activeCourses || 0}
                  subtitle="Currently running courses"
                  icon={TrendingUp}
                  gradient="bg-gradient-to-r from-green-500 to-emerald-600"
                  bgGradient="bg-gradient-to-br from-white to-green-50"
                />

                <StatsCard
                  title="Total Students"
                  value={stats?.totalStudents || 0}
                  subtitle="Enrolled across all programs"
                  icon={Users}
                  gradient="bg-gradient-to-r from-orange-500 to-amber-600"
                  bgGradient="bg-gradient-to-br from-white to-orange-50"
                />

                <StatsCard
                  title="Average Rating"
                  value={stats?.averageRating || 0}
                  subtitle="Course satisfaction score"
                  icon={Star}
                  gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
                  bgGradient="bg-gradient-to-br from-white to-purple-50"
                />
              </StatsGrid>
            )}

            {/* Filters and Actions Card (keeps unmentioned at top) */}
             <Card className="p-4 sm:p-6 bg-white">
               <div className="space-y-4">
                 {/* Actions Row: keep only add course here */}
                 <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 lg:items-center lg:justify-between">
                   <div className="flex gap-2">
                     <Button
                       onClick={handleAddCourse}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-6 py-3.5 h-auto w-full sm:w-auto text-base rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                     >
                       <Plus className="h-5 w-5 mr-2.5" />
                       <span className="hidden xs:inline text-white">Add Course Subject</span>
                       <span className="xs:hidden text-white">Add</span>
                     </Button>
                   </div>
                 </div>
               </div>
             </Card>

            {/* Course Tabs Card */}
            <Card className="p-4 sm:p-6 bg-white">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Course Programs</h3>
                <p className="text-sm text-gray-600">Browse courses by program type and add new courses</p>
              </div>

              <CourseTabs
                 activeTab={activeTab}
                 onTabChangeAction={handleTabChange}
                 tabs={tabs}
                 className="mb-6"
                 mobileActiveLabel
               />

              {/* Move ONLY status filter and search bar under tabs */}
              <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:gap-4 lg:items-center lg:justify-between mb-6">
                {/* Status Filter */}
                <div className="relative w-full sm:max-w-xs">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full pl-10">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="active">Active Courses</SelectItem>
                      <SelectItem value="inactive">Inactive Courses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-96">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${
                    searchTerm ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search courses by name, instructor, or program..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg font-apercu-regular focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200 hover:border-indigo-300 ${
                      searchTerm ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-300'
                    }`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center text-lg leading-none"
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Summary under filters with program badge */}
              <div className="flex items-center gap-2 mb-6 text-sm text-gray-700">
                <span>Showing courses for</span>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </Badge>
                {statusFilter !== 'all' && (
                  <span className="ml-2">• Filter: <span className="font-medium">{statusFilter === 'active' ? 'Active' : 'Inactive'} Courses</span></span>
                )}
                {searchTerm && (
                  <span className="ml-2">• Searching: <span className="font-medium break-all">"{searchTerm}"</span></span>
                )}
              </div>

              <CourseTabContent activeTab={activeTab}>
                <CourseList 
                  programType={activeTab}
                  programLabel={tabs.find(tab => tab.id === activeTab)?.label || activeTab}
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                  onCreateCourse={() => setIsCreateModalOpen(true)}
                  onCourseUpdated={handleCourseUpdated}
                  refreshTrigger={refreshTrigger}
                />
              </CourseTabContent>
            </Card>

          </div>

          {/* Create Course Modal */}
          <CreateCourseModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCourseCreated={handleCourseCreated}
          />
        </ToastProvider>
      </AdminLayoutNew>
    </ProtectedRoute>
  )
}