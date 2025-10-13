'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  Users,
  Link as LinkIcon
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    { title: 'Auto-Generated Matric Number', description: 'Receive your matric number automatically upon registration.', icon: Users },
    { title: 'Institutional Email Generation', description: 'Get a personalized institutional email address.', icon: Mail },
    { title: 'School Calendar & Events', description: 'Stay updated on important academic dates and events.', icon: Calendar },
    { title: 'Smart Link to Instructors', description: 'Connect with course instructors and e-tutors directly.', icon: LinkIcon },
    { title: 'Seamless Mobile Class Access', description: 'Access Mobile Class dashboard automatically from the portal.', icon: GraduationCap },
    { title: 'Flexible Payments', description: 'Choose full, semester, or part-semester payment options.', icon: CheckCircle },
    { title: 'Programme Services', description: 'Access programme services online at your convenience.', icon: Phone }
  ]

  const updates = [
    { title: 'Admission for 2024/2025 Session Now Open', description: 'Applications are now open. Explore flexible programmes designed for working professionals and students nationwide.', cta: { label: 'Apply Now', href: '/signup' } },
    { title: '2nd Semester Commences', description: 'Virtual lectures begin on 24th March, 2025. View the detailed timetable in your portal.', cta: { label: 'View Calendar', href: '/student/calendar' } },
    { title: 'Register Now & Pay Later', description: 'Start lectures with a part payment of ₦50,000. Balance is due before exams.', cta: { label: 'Learn More', href: '/signup' } },
    { title: 'SSO Login Improves Experience', description: 'Single Sign-On provides streamlined access to your portal and Mobile Class.', cta: { label: 'Login', href: '/login' } },
    { title: 'Mobile Class App 4.5', description: 'Enjoy improved navigation, enhanced discussions, and streamlined course content.', cta: { label: 'Go to Mobile Class', href: '/student/dashboard' } },
    { title: 'Save Data Costs', description: 'Download materials on-the-go and access offline. Connect only for live activities.', cta: { label: 'View Tips', href: '/student/dashboard' } }
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-4">
                <GraduationCap className="h-4 w-4" />
                <span className="text-xs font-apercu-medium">OpenDistance e‑Learning</span>
              </div>
              <h1 className="font-apercu-bold text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
                Study at Your Own Pace
              </h1>
              <p className="font-apercu-regular text-indigo-100 text-base sm:text-lg mb-8 max-w-2xl">
                Flexible, accessible, and high‑quality programmes designed for students and working professionals nationwide.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-apercu-medium">Apply Now</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 font-apercu-medium">Student Login</Button>
                </Link>
                <Link href="/admin/login">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 font-apercu-medium">Admin Login</Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  {features.slice(0,4).map((f, idx) => (
                    <div key={idx} className="bg-white/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/30 flex items-center justify-center">
                          <f.icon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-white text-sm font-apercu-medium">{f.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Features */}
      <section className="max-w-7xl mx-auto px-6 -mt-10">
        <Card className="shadow-xl border-2 border-[#efefef] bg-white">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-apercu-bold text-xl text-gray-900">Portal Features</h2>
                  <p className="font-apercu-regular text-sm text-gray-600">Tools designed for seamless learning and academic management</p>
                </div>
              </div>
              <Link href="/signup">
                <Button className="font-apercu-medium">Get Started</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, idx) => (
                <div key={idx} className="group rounded-xl border border-gray-200 hover:border-indigo-300 p-4 transition-colors bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 bg-indigo-50 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center">
                      <f.icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="font-apercu-medium text-gray-900">{f.title}</h3>
                  </div>
                  <p className="font-apercu-regular text-sm text-gray-600">{f.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Updates */}
      <section className="max-w-7xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {updates.map((u, idx) => (
              <Card key={idx} className="border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-apercu-bold text-lg text-gray-900 mb-1">{u.title}</h3>
                      <p className="font-apercu-regular text-sm text-gray-600">{u.description}</p>
                    </div>
                    {u.cta && (
                      <Link href={u.cta.href} className="shrink-0">
                        <Button variant="outline" className="font-apercu-medium">{u.cta.label}</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-apercu-bold text-base text-gray-900">Start Attending Virtual Lectures</h3>
                </div>
                <p className="font-apercu-regular text-sm text-gray-600 mb-4">Register today and join virtual lectures immediately. Part payment options available.</p>
                <div className="flex gap-2">
                  <Link href="/signup"><Button className="font-apercu-medium">Register</Button></Link>
                  <Link href="/login"><Button variant="outline" className="font-apercu-medium">Login</Button></Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-5">
                <h3 className="font-apercu-bold text-base text-gray-900 mb-2">Need Help? Get Support</h3>
                <p className="font-apercu-regular text-sm text-gray-600 mb-4">Access personalized Learner Support and Academic Advising services anytime, anywhere.</p>
                <div className="space-y-2 text-sm">
                  <p className="font-apercu-regular text-gray-700">Phone: 0816 140 0584 (9am - 3pm | Mon - Fri)</p>
                  <p className="font-apercu-regular text-gray-700">Connect with experienced E‑Tutors via your course page</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-14 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-apercu-regular text-sm text-gray-500">© {new Date().getFullYear()} Mopgom OpenDistance e‑Learning</p>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-apercu-medium">Apply Now</Link>
              <span className="text-gray-300">•</span>
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-apercu-medium">Student Login</Link>
              <span className="text-gray-300">•</span>
              <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-700 font-apercu-medium">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
