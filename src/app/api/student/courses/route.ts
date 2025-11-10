import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'
import { normalizeProgram, subjectAreaWhere, programLabel } from '@/lib/programs'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    // Only allow non-admin users to view student courses
    if (auth.user.type !== 'user') {
      console.warn('Student courses access denied due to user type:', auth.user.type, 'role:', auth.user.role?.name)
      return NextResponse.json({ error: 'Access denied. Students only.' }, { status: 403 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''

    // Determine the student's registered program.
    // Prefer courseDesired from the authenticated user, then fall back to registration/user records.
    let courseDesired: string | null | undefined = (auth.user as any)?.courseDesired

    if (!courseDesired) {
      // Try registration via email (case-insensitive contains to handle case mismatches)
      if (auth.user.email) {
        const byEmailReg = await prisma.registration.findFirst({
          where: {
            OR: [
              { emailAddress: auth.user.email },
              { emailAddress: auth.user.email.toLowerCase() },
              { emailAddress: auth.user.email.toUpperCase() }
            ]
          },
          select: { courseDesired: true }
        })
        courseDesired = byEmailReg?.courseDesired || null
      }

      // If still unknown, try by full name
      if (!courseDesired && auth.user.name) {
        const byNameReg = await prisma.registration.findFirst({
          where: {
            OR: [
              { fullName: auth.user.name },
              { fullName: auth.user.name.toLowerCase() },
              { fullName: auth.user.name.toUpperCase() }
            ]
          },
          select: { courseDesired: true }
        })
        courseDesired = byNameReg?.courseDesired || null
      }

      // Final fallback: check Student records by email/name to bridge legacy imports
      if (!courseDesired && auth.user.email) {
        const student = await prisma.student.findFirst({
          where: {
            OR: [
              { emailAddress: auth.user.email },
              { emailAddress: auth.user.email.toLowerCase() },
              { emailAddress: auth.user.email.toUpperCase() },
              { fullName: auth.user.name },
              { fullName: auth.user.name.toLowerCase() },
              { fullName: auth.user.name.toUpperCase() }
            ]
          },
          select: { emailAddress: true }
        })
        if (student?.emailAddress) {
          const fromStudentReg = await prisma.registration.findFirst({
            where: {
              OR: [
                { emailAddress: student.emailAddress },
                { emailAddress: student.emailAddress.toLowerCase() },
                { emailAddress: student.emailAddress.toUpperCase() }
              ]
            },
            select: { courseDesired: true }
          })
          courseDesired = fromStudentReg?.courseDesired || null
        }
      }
    }

    const program = normalizeProgram(courseDesired)
    console.log('Student courses resolver:', {
      userId: auth.user.id,
      email: auth.user.email,
      role: auth.user.role?.name,
      courseDesired,
      normalizedProgram: program
    })
    if (!program) {
      // If program is unknown, return empty list rather than exposing other programs
      return NextResponse.json({ courses: [], programLabel: null })
    }

    const where: any = {
      isActive: true,
      ...subjectAreaWhere(program)
    }
    console.log('Student courses query where:', where)

    if (search) {
      where.OR = [
        { courseName: { contains: search } },
        { courseCode: { contains: search } },
        { description: { contains: search } },
        { instructor: { contains: search } }
      ]
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { courseName: 'asc' },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        subjectArea: true,
        instructor: true,
        description: true,
        isActive: true
      }
    })
    console.log('Student courses results:', { count: courses.length })

    const label = programLabel(program)
    return NextResponse.json({ courses, programLabel: label })
  } catch (error) {
    console.error('Error fetching student program courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}