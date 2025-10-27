'use client'

import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import { BookOpen, Users, Calendar, Award } from 'lucide-react'

export default function CoursesPage() {
  return (
    <ProtectedRoute requiredRoles={['Super Admin', 'Admin', 'Manager', 'Staff']}>
      <AdminLayoutNew title="Course Management" description="Manage courses and curriculum">
        <div className="space-y-6 px-6">
          {/* Stats Cards - Using Dashboard Style */}
          <StatsGrid columns={4}>
            <StatsCard
              title="Total Courses"
              value={0}
              subtitle="All courses"
              icon={BookOpen}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
              bgGradient="bg-gradient-to-br from-white to-blue-50"
              href="/admin/courses"
              ariaLabel="Go to courses"
            />

            <StatsCard
              title="Active Courses"
              value={0}
              subtitle="Currently running"
              icon={Users}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
              bgGradient="bg-gradient-to-br from-white to-green-50"
              href="/admin/courses"
              ariaLabel="Go to active courses"
            />

            <StatsCard
              title="This Semester"
              value={0}
              subtitle="Current semester"
              icon={Calendar}
              gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
              bgGradient="bg-gradient-to-br from-white to-purple-50"
              href="/admin/courses"
              ariaLabel="Go to semester courses"
            />

            <StatsCard
              title="Completed"
              value={0}
              subtitle="Finished courses"
              icon={Award}
              gradient="bg-gradient-to-r from-orange-500 to-amber-600"
              bgGradient="bg-gradient-to-br from-white to-orange-50"
              href="/admin/courses"
              ariaLabel="Go to completed courses"
            />
          </StatsGrid>

          {/* Course Of Study Options */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Course Of Study Programs</CardTitle>
              <p className="text-gray-600 mt-2">Available academic programs and courses offered by the seminary</p>
            </CardHeader>
            <CardContent>
              {/* Responsive Grid Layout - Tablet View Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                
                {/* General Certificate - Available */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Available</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">General Certificate</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Comprehensive online learning program covering fundamental theological studies and practical ministry skills.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Duration: 1-2 Years</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span>Mode: Online</span>
                    </div>
                  </div>
                </div>

                {/* Diploma Certificate - Coming Soon */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 md:p-6 opacity-75 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Diploma Certificate</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Advanced theological studies with specialized focus areas and enhanced practical training components.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Duration: 2-3 Years</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span>Mode: Hybrid</span>
                    </div>
                  </div>
                </div>

                {/* Bachelor's Degree - Coming Soon */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-4 md:p-6 opacity-75 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Bachelor's Degree</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Comprehensive undergraduate program in theology with research components and leadership development.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Duration: 3-4 Years</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span>Mode: On-Campus</span>
                    </div>
                  </div>
                </div>

                {/* Master's Degree - Coming Soon */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4 md:p-6 opacity-75 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Master's Degree</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Advanced graduate studies with specialization tracks and independent research opportunities.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Duration: 2-3 Years</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span>Mode: On-Campus</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayoutNew>
    </ProtectedRoute>
  )
}