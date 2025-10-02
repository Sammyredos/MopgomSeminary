'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  Settings,
  User,
  Users,
  FileText,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { StudentLayout } from '@/components/student/StudentLayout'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { RegistrationWarning } from '@/components/student/RegistrationWarning'
import { checkRegistrationCompletion, RegistrationCompletionStatus } from '@/utils/registrationCompletion'

interface StudentData {
  id: string
  studentId: string
  matriculationNumber?: string
  fullName: string
  emailAddress: string
  phoneNumber: string
  grade: string
  academicYear: string
  enrollmentDate: string
  currentClass?: string
  profileImage?: string
  gpa?: number
  totalCredits?: number
  completedCredits?: number
}

interface AcademicInfo {
  currentSemester: string
  upcomingDeadlines: Array<{
    id: string
    title: string
    date: string
    type: 'assignment' | 'exam' | 'project' | 'event'
    course: string
  }>
  recentGrades: Array<{
    id: string
    course: string
    assignment: string
    grade: string
    date: string
  }>
  courseSchedule: Array<{
    id: string
    course: string
    time: string
    room: string
    instructor: string
    day: string
  }>
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  date: string
  read: boolean
}

export default function StudentDashboard() {
  const router = useRouter()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationCompletionStatus | null>(null)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // First try to get student profile data which includes matriculation number
        let response = await fetch('/api/student/profile')
        let userData
        
        if (response.ok) {
          const data = await response.json()
          userData = data.user || data
        } else {
          // Fallback to /api/auth/me if profile endpoint fails
          response = await fetch('/api/auth/me')
          if (response.ok) {
            const data = await response.json()
            userData = data.user || data
          }
        }
        
        if (userData) {
          const studentDataObj = {
            id: userData.id,
            studentId: userData.studentId || userData.id,
            matriculationNumber: userData.matriculationNumber,
            fullName: userData.fullName || userData.name || 'Student',
            emailAddress: userData.email,
            phoneNumber: userData.phoneNumber || userData.phone || '',
            grade: userData.grade || 'N/A',
            academicYear: userData.academicYear || new Date().getFullYear().toString(),
            enrollmentDate: userData.enrollmentDate || new Date().toISOString(),
            currentClass: userData.currentClass,
            profileImage: userData.profileImage,
            gpa: userData.gpa,
            totalCredits: userData.totalCredits,
            completedCredits: userData.completedCredits
          }
          
          setStudentData(studentDataObj)
          
          // Check registration completion status
          const completionStatus = checkRegistrationCompletion({
            name: userData.fullName || userData.name,
            email: userData.email,
            phone: userData.phoneNumber || userData.phone,
            dateOfBirth: userData.dateOfBirth,
            gender: userData.gender,
            homeAddress: userData.homeAddress,
            officePostalAddress: userData.officePostalAddress,
            maritalStatus: userData.maritalStatus,
            spouseName: userData.spouseName,
            placeOfBirth: userData.placeOfBirth,
            origin: userData.origin,
            presentOccupation: userData.presentOccupation,
            placeOfWork: userData.placeOfWork,
            positionHeldInOffice: userData.positionHeldInOffice,
            acceptedJesusChrist: userData.acceptedJesusChrist,
            whenAcceptedJesus: userData.whenAcceptedJesus,
            churchAffiliation: userData.churchAffiliation,
            schoolsAttended: userData.schoolsAttended,
            courseDesired: userData.courseDesired
          })
          
          setRegistrationStatus(completionStatus)
        }
        
        // Initialize empty academic info - to be populated by actual API calls
        const academicInfo: AcademicInfo = {
          currentSemester: 'Not available',
          upcomingDeadlines: [],
          recentGrades: [],
          courseSchedule: []
        }

        const notifications: Notification[] = []

        setAcademicInfo(academicInfo)
        setNotifications(notifications)
      } catch (error) {
        console.error('Error fetching student data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        // Always set loading to false, regardless of success or error
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDeadlineColor = (date: string) => {
    const deadline = new Date(date)
    const today = new Date()
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) return 'text-red-600 bg-red-50'
    if (diffDays <= 3) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  // Show loading state for dashboard data
  if (loading) {
    return (
      <ProtectedRoute>
        <StudentLayout>
          <div className="space-y-6">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
                <div className="space-y-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    )
  }

  if (!studentData) {
    return (
      <ProtectedRoute>
        <StudentLayout>
          <div className="space-y-6">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
                <p className="text-gray-600 mb-6">Please try refreshing the page or contact support.</p>
                <Button onClick={() => window.location.reload()} className="w-full">
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <StudentLayout 
        title="Student Dashboard"
        description="Overview of your academic progress and activities"
      >
      <div className="space-y-6">
        {/* Registration Warning - Show if profile is incomplete */}
        {registrationStatus && !registrationStatus.isComplete && (
          <RegistrationWarning completionStatus={registrationStatus} />
        )}

        {/* Hero Stats Section */}
        <div>
          <StatsGrid columns={4}>
            <StatsCard
              title="Current GPA"
              value={studentData.gpa || 0}
              subtitle="Academic performance"
              icon={TrendingUp}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
              bgGradient="bg-gradient-to-br from-white to-blue-50"
            />

            <StatsCard
              title="Credits"
              value={`${studentData.completedCredits}/${studentData.totalCredits}`}
              subtitle="Course completion"
              icon={BookOpen}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
              bgGradient="bg-gradient-to-br from-white to-green-50"
            />

            <StatsCard
              title="Current Grade"
              value={studentData.grade || 'N/A'}
              subtitle="Academic level"
              icon={GraduationCap}
              gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
              bgGradient="bg-gradient-to-br from-white to-purple-50"
            />

            <StatsCard
              title="Progress"
              value={`${Math.round((studentData.completedCredits! / studentData.totalCredits!) * 100)}%`}
              subtitle="Completion rate"
              icon={Award}
              gradient="bg-gradient-to-r from-orange-500 to-amber-600"
              bgGradient="bg-gradient-to-br from-white to-orange-50"
            />
          </StatsGrid>
        </div>

        {/* Main Dashboard Content - Professional Layout */}
        <div>
          <div className="space-y-8">
            {/* Primary Content Row - Academic Overview & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Academic Progress - Primary Focus */}
              <div className="lg:col-span-8">
                <div className="space-y-6">

                  {/* Upcoming Deadlines */}
                  <Card className="bg-white">
                    <div className="p-4 sm:p-6 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-gray-900">Upcoming Deadlines</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Important dates and tasks</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {academicInfo?.upcomingDeadlines.map((deadline) => (
                          <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${getDeadlineColor(deadline.date)}`}>
                                {deadline.type === 'assignment' && <FileText className="h-4 w-4" />}
                                {deadline.type === 'exam' && <BookOpen className="h-4 w-4" />}
                                {deadline.type === 'project' && <Award className="h-4 w-4" />}
                                {deadline.type === 'event' && <Calendar className="h-4 w-4" />}
                              </div>
                              <div>
                                <div className="font-medium">{deadline.title}</div>
                                <div className="text-sm text-gray-600">{deadline.course}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatDate(deadline.date)}</div>
                              <Badge variant="outline" className="text-xs">
                                {deadline.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                  </Card>

                  {/* Recent Grades */}
                  <Card className="bg-white">
                    <div className="p-4 sm:p-6 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-gray-900">Recent Grades</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Latest academic results</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-3">
                        {academicInfo?.recentGrades.map((grade) => (
                          <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <div className="font-medium">{grade.assignment}</div>
                              <div className="text-sm text-gray-600">{grade.course}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">{grade.grade}</div>
                              <div className="text-xs text-gray-500">{formatDate(grade.date)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                  </Card>
                </div>
              </div>

              {/* Sidebar - Student Info & Quick Actions */}
              <div className="lg:col-span-4">
                <div className="space-y-6">
                  {/* Student Information */}
                  <Card className="bg-white">
                    <div className="p-4 sm:p-6 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-gray-900">Student Information</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Personal details and status</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm"><span className="font-semibold">Matric Number:</span> {studentData.matriculationNumber || 'Not assigned'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm"><span className="font-semibold">Email:</span> {studentData.emailAddress}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm"><span className="font-semibold">Phone Number:</span> {studentData.phoneNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm"><span className="font-semibold">Enrolled:</span> {formatDate(studentData.enrollmentDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm"><span className="font-semibold">Class:</span> {studentData.currentClass}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-white">
                    <div className="p-4 sm:p-6 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-gray-900">Quick Actions</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Common student tasks</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      <Button className="w-full justify-start" variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Courses
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Class Schedule
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Award className="h-4 w-4 mr-2" />
                        Grades & Transcripts
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Student Services
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Forms
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Secondary Content Row - Notifications & Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notifications */}
              <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-gray-900">Recent Notifications</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Important updates and alerts</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-2">
                        {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />}
                        {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                        {notification.type === 'info' && <Bell className="h-4 w-4 text-blue-500 mt-0.5" />}
                        {notification.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{notification.title}</div>
                          <div className="text-xs text-gray-600">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-1">{formatDate(notification.date)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" size="sm">
                    View All Notifications
                  </Button>
                </div>
              </Card>

              {/* Today's Schedule */}
              <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-gray-900">Today's Schedule</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Current day classes</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-3">
                  {academicInfo?.courseSchedule.slice(0, 3).map((course) => (
                    <div key={course.id} className="p-3 rounded-lg border">
                      <div className="font-medium text-sm">{course.course}</div>
                      <div className="text-xs text-gray-600">{course.time}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{course.room}</span>
                        <span className="text-xs text-gray-500">{course.instructor}</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Full Schedule
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </StudentLayout>
    </ProtectedRoute>
  )
}