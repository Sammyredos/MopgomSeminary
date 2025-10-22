'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
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
import AutoCalendarView from '@/components/admin/AutoCalendarView'
import { useMessages } from '@/contexts/MessageContext'

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
  courseDesired?: string
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
  const [calendarEvents, setCalendarEvents] = useState<Array<{
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
  }>>([])
  const [calendarLoading, setCalendarLoading] = useState<boolean>(false)
  const [studentInfoHeight, setStudentInfoHeight] = useState<number>(340)
  const studentInfoRef = useRef<HTMLDivElement | null>(null)
  const [coursesCount, setCoursesCount] = useState<number>(0)
  const { stats: messageStats } = useMessages()
  // Modal state for calendar date click
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)
  const [selectedCalendarEvents, setSelectedCalendarEvents] = useState<typeof calendarEvents>([])

  // Centralized student data fetch with cache-busting and no-store
  const fetchStudentData = async () => {
    try {
      const ts = Date.now()
      let response = await fetch(`/api/student/profile?_t=${ts}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      let userData: any

      if (response.ok) {
        const data = await response.json()
        userData = data.user || data
      } else {
        response = await fetch(`/api/auth/me?_t=${ts}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
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
          courseDesired: userData.courseDesired,
          profileImage: userData.profileImage,
          gpa: userData.gpa,
          totalCredits: userData.totalCredits,
          completedCredits: userData.completedCredits
        }
        setStudentData(studentDataObj)

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
      setLoading(false)
    }
  }

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch student data
  useEffect(() => {
    fetchStudentData()
  }, [])

  // Observe Student Information card height to cap calendar height
  useEffect(() => {
    const el = studentInfoRef.current
    if (!el) return

    const updateHeight = () => setStudentInfoHeight(el.offsetHeight)
    updateHeight()

    const ResizeObs = (window as any).ResizeObserver
    if (ResizeObs) {
      const ro = new ResizeObs((entries: any[]) => {
        const rect = entries?.[0]?.contentRect
        if (rect?.height) setStudentInfoHeight(Math.ceil(rect.height))
      })
      ro.observe(el)
      return () => ro.disconnect()
    } else {
      const interval = setInterval(updateHeight, 1000)
      return () => clearInterval(interval)
    }
  }, [])

  // Calendar fetcher reused by effects
  const fetchCalendar = async () => {
    try {
      setCalendarLoading(true)
      const ts = Date.now()
      const res = await fetch(`/api/student/calendar?limit=200&_t=${ts}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      if (res.ok) {
        const data = await res.json()
        setCalendarEvents(data.events || [])
      }
    } catch (err) {
      console.error('Error fetching student calendar:', err)
    } finally {
      setCalendarLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCalendar()
  }, [])

  // Refresh calendar when tab regains focus
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCalendar()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Poll calendar periodically to keep events current
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCalendar()
    }, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [])

  // Fetch enrolled course count
  useEffect(() => {
    const fetchCoursesCount = async () => {
      try {
        if (!studentData?.id) return
        const res = await fetch(`/api/students/${studentData.id}`)
        if (res.ok) {
          const data = await res.json()
          const count = Array.isArray(data?.courseAllocations) ? data.courseAllocations.length : 0
          setCoursesCount(count)
        }
      } catch (err) {
        console.warn('Failed to fetch course count:', err)
      }
    }
    fetchCoursesCount()
  }, [studentData?.id])

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

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter((event) => {
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      return target >= startDay && target <= endDay
    })
  }

  const handleCalendarDateClick = (clickedDate: Date) => {
    setSelectedCalendarDate(clickedDate)
    const dayEvents = getEventsForDate(clickedDate)
    // Always open the modal and show a minimal state indicating
    // whether there are events for the selected day or not
    setSelectedCalendarEvents(dayEvents)
    setIsCalendarModalOpen(true)
  }
  const getDeadlineColor = (date: string) => {
    const deadline = new Date(date)
    const today = new Date()
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) return 'text-red-600 bg-red-50'
    if (diffDays <= 3) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  // Derive upcoming deadlines from calendar events if academicInfo has none
  // Include ongoing events (start <= now <= end) and future events
  const nowTs = new Date().getTime()
  const upcomingFromCalendar = calendarEvents
    .filter(e => {
      const startTs = new Date(e.startDate).getTime()
      const endTs = new Date(e.endDate).getTime()
      return endTs >= nowTs // ongoing or in the future
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 6)
    .map(e => ({
      id: e.id,
      title: e.title,
      date: e.startDate,
      type: (e.eventType === 'EXAM' ? 'exam' : 'event') as 'assignment' | 'exam' | 'project' | 'event',
      course: 'Academic Calendar'
    }))

  // Source list for upcoming deadlines (limit display later to 3)
  const upcomingSource = (academicInfo?.upcomingDeadlines?.length ? academicInfo.upcomingDeadlines : upcomingFromCalendar)

  // Stats derivations
  const pendingAssignments = (academicInfo?.upcomingDeadlines?.length ? academicInfo.upcomingDeadlines : upcomingFromCalendar)
    .filter(d => {
      const isAssignmentType = d.type === 'assignment' || /assignment|homework|project/i.test(d.title)
      return isAssignmentType && new Date(d.date) >= new Date()
    }).length

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const upcomingEventsCount = calendarEvents.filter(e => {
    const sd = new Date(e.startDate)
    return sd >= now && sd >= monthStart && sd <= monthEnd
  }).length

  const unreadMessagesCount = messageStats.unread || 0

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
          <StatsGrid columns="auto">
            {/* Total Course Subject */}
            <StatsCard
              title="Total Course Subject"
              value={coursesCount}
              subtitle="Enrolled subjects"
              icon={BookOpen}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
              bgGradient="bg-gradient-to-br from-white to-blue-50"
            />

            {/* Assignments Pending */}
            <StatsCard
              title="Assignments"
              value={pendingAssignments}
              subtitle="Pending assignments"
              icon={FileText}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
              bgGradient="bg-gradient-to-br from-white to-green-50"
            />

            {/* Upcoming Events for the Month */}
            <StatsCard
              title="Upcoming Events"
              value={upcomingEventsCount}
              subtitle="This month"
              icon={Calendar}
              gradient="bg-gradient-to-r from-orange-500 to-amber-600"
              bgGradient="bg-gradient-to-br from-white to-orange-50"
            />

            {/* Unread Messages */}
            <StatsCard
              title="Messages"
              value={unreadMessagesCount}
              subtitle="Unread"
              icon={Mail}
              gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
              bgGradient="bg-gradient-to-br from-white to-purple-50"
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

                  {/* Upcoming Deadline and Live Calendar - Two Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Deadlines */}
                    <Card className="bg-white">
                      <div className="p-4 sm:p-6 border-b border-gray-100 bg-orange-50">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg text-gray-900">Upcoming Deadline</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Important dates and tasks</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="space-y-4">
                          {upcomingSource.slice(0, 3).map((deadline) => {
                            const ev = calendarEvents.find(e => e.id === deadline.id)
                            const typeSoft: Record<string, string> = {
                              assignment: 'bg-blue-100 text-blue-700',
                              exam: 'bg-red-100 text-red-700',
                              project: 'bg-purple-100 text-purple-700',
                              event: 'bg-orange-100 text-orange-700'
                            }
                            const typeLabel = deadline.type.charAt(0).toUpperCase() + deadline.type.slice(1)

                            return (
                              <div key={deadline.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="font-medium text-sm text-gray-900 flex-1">{deadline.title}</div>
                                  <span className={`text-xs px-2 py-1 rounded-md ${typeSoft[deadline.type]}`}>{typeLabel}</span>
                                </div>
                                {deadline.course && (
                                  <p className="text-xs text-gray-600 mb-3">{deadline.course}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {ev ? `${formatDate(ev.startDate)} - ${formatDate(ev.endDate)}` : `${formatDate(deadline.date)}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {upcomingSource.length > 3 && (
                            <div className="pt-1">
                              <Link href="/student/calendar" className="inline-flex">
                                <Button variant="outline" size="sm" className="text-xs">View More</Button>
                              </Link>
                            </div>
                          )}
                          {(!academicInfo?.upcomingDeadlines?.length && !upcomingFromCalendar.length) && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <div className="h-9 w-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                                <Clock className="h-5 w-5" />
                              </div>
                              <p className="text-sm text-gray-600">No Upcoming Items</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Live Calendar (Compact, natural height to match sidebar padding/margins) */}
                    <div className="overflow-hidden">
                      <AutoCalendarView events={calendarEvents} compact className="overflow-hidden" onDateClick={handleCalendarDateClick} />
                    </div>
                  </div>

                  {/* Recent Notifications */}
                  <Card className="bg-white lg:h-[418px] flex flex-col">
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-pink-50">
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
                    <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">No notifications available</div>
                      ) : (
                        <div className="space-y-4">
                          {notifications.slice(0, 5).map((notification) => {
                            const dotClass =
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'

                            const badgeClass =
                              notification.type === 'success' ? 'bg-green-100 text-green-800' :
                              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'

                            const typeLabel =
                              notification.type === 'success' ? 'Success' :
                              notification.type === 'warning' ? 'Warning' :
                              notification.type === 'error' ? 'Error' : 'Info'

                            return (
                              <button
                                key={notification.id}
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="w-full text-left"
                              >
                                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    <div className={`h-3 w-3 rounded-full ${dotClass}`} />
                                    <span className="text-sm font-apercu-medium text-gray-700 truncate">{notification.title}</span>
                                  </div>
                                  <span className={`px-3 py-1 text-xs font-apercu-medium rounded-full ${badgeClass}`}>
                                    {typeLabel}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Sidebar - Student Info & Quick Actions */}
              <div className="lg:col-span-4">
                <div className="space-y-6">
                  {/* Student Information */}
                  <div ref={studentInfoRef}>
                    <Card className="bg-white">
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-cyan-50">
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
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        {registrationStatus && !registrationStatus.isComplete ? (
                          <span className="text-sm" aria-disabled="true">
                            <span className="font-semibold">Matric Number:</span>
                            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-300">Unavailable! Complete Profile</Badge>
                          </span>
                        ) : (
                          <span className="text-sm">
                            <span className="font-semibold">Matric Number:</span> <span className="capitalize">{studentData.matriculationNumber || 'Not assigned'}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm"><span className="font-semibold">Email:</span> <span className="capitalize">{studentData.emailAddress}</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm"><span className="font-semibold">Phone Number:</span> <span className="capitalize">{studentData.phoneNumber}</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm"><span className="font-semibold">Enrolled:</span> <span className="capitalize">{formatDate(studentData.enrollmentDate)}</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm"><span className="font-semibold">Course:</span> <span className="capitalize">{studentData.courseDesired || studentData.currentClass || 'Not selected'}</span></span>
                      </div>
                    </div>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="bg-white">
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-indigo-50">
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
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 gap-3">
                        {/** removed Profile quick action as requested **/}

                        <Link href="/student/courses" className="group">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-100 hover:border-green-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">My Courses</p>
                              <p className="text-xs text-gray-600">View enrolled courses</p>
                            </div>
                          </div>
                        </Link>

                        <Link href="/student/grades" className="group">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 border border-purple-100 hover:border-pink-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Grades & Transcripts</p>
                              <p className="text-xs text-gray-600">Review performance</p>
                            </div>
                          </div>
                        </Link>

                        {/** removed Class Schedule quick action as requested **/}

                        <Link href="/student/calendar" className="group">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 border border-indigo-100 hover:border-blue-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Calendar</p>
                              <p className="text-xs text-gray-600">Events and deadlines</p>
                            </div>
                          </div>
                        </Link>

                        <Link href="/student/messages" className="group">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-all duration-200 border border-orange-100 hover:border-red-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Messages</p>
                              <p className="text-xs text-gray-600">Communication hub</p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Secondary Content Row removed as requested */}
          </div>
    <Dialog open={isCalendarModalOpen} onOpenChange={setIsCalendarModalOpen}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="font-semibold">
                {selectedCalendarDate ? selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Selected Day'}
              </DialogTitle>
              <DialogDescription>
                {selectedCalendarEvents.length} event{selectedCalendarEvents.length !== 1 ? 's' : ''} scheduled
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {selectedCalendarEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-sm text-gray-700">No events on this day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedCalendarEvents.map((event) => {
              const typeSoft: Record<string, string> = {
                TERM: 'bg-blue-100 text-blue-700',
                HOLIDAY: 'bg-green-100 text-green-700',
                EXAM: 'bg-red-100 text-red-700',
                EVENT: 'bg-purple-100 text-purple-700',
                MEETING: 'bg-orange-100 text-orange-700'
              }
              return (
                <div key={event.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-medium text-sm text-gray-900 flex-1">{event.title}</div>
                    <span className={`text-xs px-2 py-1 rounded-md ${typeSoft[event.eventType]}`}>{event.eventType.charAt(0) + event.eventType.slice(1).toLowerCase()}</span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-600 mb-3">{event.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                    </div>
                    {event.academicYear && (
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
                        <span>{event.academicYear}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogClose asChild>
          <Button variant="outline" className="mt-4 w-full">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
        </div>
      </div>
      </StudentLayout>
    </ProtectedRoute>
  )

}
