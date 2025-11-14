'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { checkRegistrationCompletion } from '@/utils/registrationCompletion'

export default function ProfileCompletionGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        // Exempt the profile page itself to avoid loops
        if (pathname.startsWith('/student/profile')) {
          setChecked(true)
          return
        }
        // Only guard student area
        if (!pathname.startsWith('/student/')) {
          setChecked(true)
          return
        }
        const res = await fetch('/api/student/profile', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) {
          setChecked(true)
          return
        }
        const data = await res.json()
        const user = data?.user || {}
        const status = checkRegistrationCompletion({
          name: user?.name,
          email: user?.emailAddress || user?.email,
          phone: user?.phoneNumber,
          dateOfBirth: user?.dateOfBirth,
          gender: user?.gender,
          homeAddress: user?.homeAddress,
          officePostalAddress: user?.officePostalAddress,
          maritalStatus: user?.maritalStatus,
          spouseName: user?.spouseName,
          placeOfBirth: user?.placeOfBirth,
          origin: user?.origin,
          presentOccupation: user?.presentOccupation,
          placeOfWork: user?.placeOfWork,
          positionHeldInOffice: user?.positionHeldInOffice,
          acceptedJesusChrist: user?.acceptedJesusChrist,
          whenAcceptedJesus: user?.whenAcceptedJesus,
          churchAffiliation: user?.churchAffiliation,
          schoolsAttended: user?.schoolsAttended,
          courseDesired: user?.courseDesired,
        })
        if (!status.isComplete) {
          const next = encodeURIComponent(pathname)
          router.replace(`/student/profile?next=${next}`)
          return
        }
      } catch {
        // fail open
      } finally {
        setChecked(true)
      }
    }
    run()
  }, [pathname, router])

  // Render nothing; guard only performs side effects
  if (!checked) return null
  return null
}