'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  const [branding, setBranding] = useState<{ systemName?: string; logoUrl?: string }>({})

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/system/branding', { cache: 'no-store' })
        const data = await res.json()
        setBranding(data)
        if (data?.systemName) {
          document.title = data.systemName
        }
      } catch (e) {
        console.warn('Branding fetch failed:', e)
      }
    }
    fetchBranding()
  }, [])

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-body antialiased">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[1200px] flex-1">
            
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-300 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center gap-4 text-text-primary dark:text-white">
                {branding.logoUrl && (
                  <Image
                    src={branding.logoUrl}
                    alt="Seminary Logo"
                    width={80}
                    height={64}
                    className="site-logo h-16 w-auto object-contain"
                    priority
                  />
                )}
              </div>
              <nav className="hidden md:flex items-center gap-9 font-semibold text-text-primary dark:text-gray-300">
                <a className="hover:text-primary" href="#programs">Programs</a>
                <a className="hover:text-primary" href="#admissions">Admissions</a>
                <a className="hover:text-primary" href="#about">About Us</a>
                <a className="hover:text-primary" href="#contact">Contact</a>
              </nav>
              <div className="flex items-center gap-4">
                <Link href="/signup" className="flex min-w-[100px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                  <span className="truncate">Apply Now</span>
                </Link>
                <Link href="/login" className="flex min-w-[100px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 text-text-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                  <span className="truncate">Log In</span>
                </Link>
              </div>
            </header>

            {/* Hero Section */}
            <div className="relative mt-5">
              <div className="flex min-h-[520px] flex-col items-center justify-center gap-8 rounded-xl bg-cover bg-center p-6 text-center" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA20SraLEPVhTtxVrAatt6MfJovRT96zJTc-FE9l1hMrmcM_3m8lvFlfUX51E9z1pF1QXoTtXWdp1-Qy0NgMUjbkChB0oKbHQ5jXF9jaEpdXnoxnMzgUHp7edYKs17fcxa2fPXnqW_83PiDzJ-khXNfnAK99qGCjH3BU2lOrMxYc8u6xXTDZ1kc8YyDe320t0mda-RqLsPtoUg19HM6Uz2zgqH2i_QkggwPWcinGkg33T8CYlA2PlhzkFrTmX7-7xpaNCecKlYNlw')"}}>
                <div className="absolute inset-0 bg-black/50 rounded-xl"></div>
                <div className="relative z-10 flex flex-col gap-4">
                  <h1 className="text-white text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight">Equipping Leaders for a Lifetime of Ministry</h1>
                  <p className="text-gray-200 text-lg md:text-xl font-body max-w-3xl mx-auto">Discover your calling and deepen your faith with our world-class theological education.</p>
                </div>
                <div className="relative z-10 flex flex-wrap gap-4 justify-center">
                  <Link href="/signup" className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                    <span className="truncate">Apply Now</span>
                  </Link>
                  <button className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-white text-text-primary text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 transition-colors">
                    <span className="truncate">Explore Programs</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mission Statement Section */}
            <section className="py-16 sm:py-24 text-center bg-secondary dark:bg-background-dark rounded-xl mt-10">
              <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-display font-bold text-text-primary dark:text-white mb-4">Our Mission</h2>
                <p className="text-text-primary dark:text-gray-300 text-lg leading-relaxed font-body">
                  Our commitment is to provide a comprehensive theological education that is academically rigorous, spiritually formative, and practically relevant for ministry in the 21st century. We aim to cultivate a community of learners dedicated to serving the church and the world.
                </p>
              </div>
            </section>

            {/* Program Highlights Section */}
            <section id="programs" className="py-16 sm:py-24">
              <div className="text-center">
                <h2 className="text-3xl font-display font-bold text-text-primary dark:text-white mb-12">Program Highlights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
                  <Image 
                    className="w-full h-48 object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcx7sTK2PKme6Mep9pEB-zeUbwvPN6WYXT0EwVLH2R74AxgF4Va5nkyjCgHbU3CFC8plDqfMfal1Hfp5x4VS8QrmMhUvHZHQ1XwWlUBWoFTWevpI6-HZgJzzNCCO6lyTP108fiXcQX4sBnCw0HIER4l2_coWMsNXQxwvjRPWV-UYyuTlI-aYT7M8yeQotYB8Ez1TSsBGRR4tAjEC3kylJYlrO7NIrDcJ9vXckESoqPM3YnHrHMx4TLIv23N1ZTVtCpeQtbAkKsbg"
                    alt="Students studying in a library"
                    width={400}
                    height={192}
                  />
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-display font-bold text-text-primary dark:text-white mb-2">Master of Divinity (M.Div.)</h3>
                    <p className="text-text-primary dark:text-gray-300 flex-grow mb-4">A comprehensive degree preparing students for ordained ministry and pastoral leadership.</p>
                    <a className="text-primary font-semibold hover:underline mt-auto" href="#">Learn More <span aria-hidden="true">→</span></a>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
                  <Image 
                    className="w-full h-48 object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAle250fMYgIbmx5agd39a7OFYaXePC0JyIhIPsXbp3o27EQ1rTGt9qGMD-fMC9-W25ielXivGZUSHkgsbUK7vHHfTU3PyB81ru5uB5Gbi4oZrYyMPZUiS4bfylw-PJ3Yiy9waNuu8vzEXGhsxL1KySNbrn8PrgK1g67tXdSGf5KbO-K3gSFErGJnof9JFryStI7-9tkKDcWTTwLSl-w2Hq99IRRsbeaOgg1XbEDZ17kyviLFUZXMJ_JeVyKVyVMlRcsMGNq5fp-Q"
                    alt="A group of diverse students in discussion"
                    width={400}
                    height={192}
                  />
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-display font-bold text-text-primary dark:text-white mb-2">Doctor of Ministry (D.Min.)</h3>
                    <p className="text-text-primary dark:text-gray-300 flex-grow mb-4">An advanced professional degree for experienced ministry leaders seeking to enhance their skills.</p>
                    <a className="text-primary font-semibold hover:underline mt-auto" href="#">Learn More <span aria-hidden="true">→</span></a>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
                  <Image 
                    className="w-full h-48 object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuARXSAJd0xvjUI0u39Aqhr7HeTKxJ6PCGjRQAWmbPylVDE0plRBJ0jz6Oii4S2oBB1qJlmbVD_fwVruI4xipoY2HozzAiuV--l_UHFenvdPaqd9YfINaFyImtTwtbSRL7DB5Q2Fb64QxBrAcDfXhmwSjwz9Bit2ZxXalOvZbks8RInj-S4J7EqpZmuokTwhC4Xn7unOuWCnjcXUZGslQdVDUIKC7rZdyfPXDPoL5qzhnnaIZoV1_4tyMDnFJ3M4keOx-n2Pf6jLhg"
                    alt="Students collaborating on a project"
                    width={400}
                    height={192}
                  />
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-display font-bold text-text-primary dark:text-white mb-2">Master of Arts (Theological Studies)</h3>
                    <p className="text-text-primary dark:text-gray-300 flex-grow mb-4">A flexible program for those seeking a deeper understanding of theology for various vocations.</p>
                    <a className="text-primary font-semibold hover:underline mt-auto" href="#">Learn More <span aria-hidden="true">→</span></a>
                  </div>
                </div>
              </div>
            </section>

            {/* "Why Choose Us?" Section */}
            <section className="py-16 sm:py-24 bg-white dark:bg-gray-800 rounded-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h2 className="text-3xl font-display font-bold text-text-primary dark:text-white mb-12">Why Choose Our Seminary?</h2>
                </div>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="text-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary mx-auto mb-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S12 9.67 12 10.5V18h2v-4h3v4h2V8.5c0-1.93-1.57-3.5-3.5-3.5S12 6.57 12 8.5V18H4z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-primary dark:text-white">World-Class Faculty</h3>
                    <p className="mt-2 text-text-primary dark:text-gray-300">Learn from leading scholars and experienced practitioners dedicated to your growth.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary mx-auto mb-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-primary dark:text-white">Flexible Learning</h3>
                    <p className="mt-2 text-text-primary dark:text-gray-300">Choose from online, in-person, or hybrid formats to fit your life and ministry.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary mx-auto mb-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-primary dark:text-white">Vibrant Community</h3>
                    <p className="mt-2 text-text-primary dark:text-gray-300">Join a supportive and diverse community of learners from around the world.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16 sm:py-24">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-display font-bold text-text-primary dark:text-white mb-12">From Our Community</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-secondary dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <Image 
                      className="w-20 h-20 mx-auto rounded-full -mt-16 border-4 border-white dark:border-gray-700" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHeQXQsKCP78z37wVWSqtr2bPfa270Jbov4C0VZBcfgTjIgiRYMZMDs4KPVqHRfiJZwb3hGd45K7mSfIWlZSF6Hyhf1A8J69H_KLM6y12ZtVJMihomMtIvXveJJX8ahrIoiUIKjVKRlXwoPDt54adKLlMOygAdFDSuSFFk0NH_GN39Y7xfFxDna8pP5phm5X-VnKQriqbAedCwCnxE1jdEIx7anrZfc42e_4Pu0nj0gxYGjY8LXFgM0-qOkwDaDnHHzJJgUKfKJw"
                      alt="Photo of Jane Doe"
                      width={80}
                      height={80}
                    />
                    <blockquote className="mt-4">
                      <p className="text-lg text-text-primary dark:text-gray-300 italic">&quot;The education I received here was not just academic; it was transformative. The faculty truly invested in my spiritual and personal development.&quot;</p>
                    </blockquote>
                    <cite className="mt-4 block font-bold text-text-primary dark:text-white not-italic">Jane Doe, M.Div. &apos;22</cite>
                  </div>
                  <div className="bg-secondary dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <Image 
                      className="w-20 h-20 mx-auto rounded-full -mt-16 border-4 border-white dark:border-gray-700" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2hsvjIvb_E6wa_ng0Vwe7eAdMTbnEJ2hFeBgvUUnKyxKVRZ_GB9Wh5b0ZfJiYwBYrQV0ldE6IP59ChUz8mta8RD1CzZX2ayMdD9qK39DPOfWLfGOlRLLAmS0R58PbdkBb-obWylVyPnuMOu1fqfByStCxGYJmO5D1K_KDgZiCx9eGTRfOqjKeW170TJoSuPTDonJgSRVmbMnccRB12s9XFljH9l59p04x7tps4I4u_qb94rGyXiRlsHQITQopuYWLUmLnTg7oDw"
                      alt="Photo of John Smith"
                      width={80}
                      height={80}
                    />
                    <blockquote className="mt-4">
                      <p className="text-lg text-text-primary dark:text-gray-300 italic">&quot;This seminary challenged me to think critically and love more deeply. It has profoundly shaped my ministry and my life.&quot;</p>
                    </blockquote>
                    <cite className="mt-4 block font-bold text-text-primary dark:text-white not-italic">John Smith, D.Min. &apos;21</cite>
                  </div>
                </div>
              </div>
            </section>

            {/* Newsletter Subscription Form */}
            <section className="bg-primary text-white rounded-xl my-10">
              <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 text-center">
                <h2 className="text-3xl font-display font-extrabold tracking-tight sm:text-4xl">Stay Connected with Our Community</h2>
                <p className="mt-4 text-lg leading-6 text-indigo-100">Get the latest news, events, and stories from our seminary delivered to your inbox.</p>
                <div className="mt-8 sm:flex justify-center">
                  <form action="#" className="sm:flex w-full max-w-lg" method="POST">
                    <label className="sr-only" htmlFor="email-address">Email address</label>
                    <input 
                      autoComplete="email" 
                      className="w-full px-5 py-3 border border-transparent placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white focus:border-white rounded-md text-text-primary" 
                      id="email-address" 
                      name="email" 
                      placeholder="Enter your email" 
                      required 
                      type="email"
                    />
                    <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                      <button className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-indigo-50" type="submit">Subscribe</button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-secondary dark:bg-background-dark text-text-primary dark:text-gray-400 py-12 rounded-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-display font-bold text-text-primary dark:text-white">Seminary</h3>
                  <p className="mt-2 text-sm">Equipping leaders for a lifetime of ministry.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary dark:text-white">Quick Links</h4>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li><a className="hover:text-primary" href="#about">About Us</a></li>
                    <li><a className="hover:text-primary" href="#admissions">Admissions</a></li>
                    <li><a className="hover:text-primary" href="#programs">Academics</a></li>
                    <li><a className="hover:text-primary" href="#contact">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary dark:text-white">Connect</h4>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li><a className="hover:text-primary" href="#">Facebook</a></li>
                    <li><a className="hover:text-primary" href="#">Twitter</a></li>
                    <li><a className="hover:text-primary" href="#">Instagram</a></li>
                    <li><a className="hover:text-primary" href="#">LinkedIn</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary dark:text-white">Contact Us</h4>
                  <p className="mt-4 text-sm">123 Seminary Drive<br/>Faithville, USA 12345</p>
                  <p className="mt-2 text-sm">(123) 456-7890</p>
                  <p className="mt-2 text-sm"><a className="hover:text-primary" href="mailto:info@seminary.edu">info@seminary.edu</a></p>
                </div>
              </div>
              <div className="mt-8 border-t border-gray-300 dark:border-gray-700 pt-8 text-center text-sm">
                <p>© 2024 Seminary. All rights reserved.</p>
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  )
}
