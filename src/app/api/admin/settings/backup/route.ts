import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies?.get('auth-token')?.value
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({ error: 'Unauthorized - No valid token provided' }, { status: 401 })
    }

    let payload: any
    try {
      payload = verifyToken(token)
      if (!payload || typeof payload !== 'object') {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    if (!payload.adminId || typeof payload.adminId !== 'string') {
      return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 })
    }

    const userType = payload.type || 'admin'

    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const currentAdmin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: {
        id: true,
        isActive: true,
        role: { select: { name: true } },
        email: true,
        name: true
      }
    })

    if (!currentAdmin || !currentAdmin.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    if (!['Super Admin', 'Admin'].includes(currentAdmin.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const exportedAt = new Date().toISOString()

    const [
      admins,
      users,
      roles,
      permissions,
      rolePermissions,
      students,
      teachers,
      subjects,
      teacherSubjects,
      courses,
      courseSessions,
      courseContents,
      courseAllocations,
      classSectionAllocations,
      classSectionParticipants,
      platoonEmailHistory,
      grades,
      registrations,
      rooms,
      roomAllocations,
      settings,
      systemConfig,
      notifications,
      messages,
      smsVerifications,
      loginAttempts,
      calendarEvents
    ] = await Promise.all([
      prisma.admin.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          roleId: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
          phoneVerified: true,
          phoneVerifiedAt: true,
          roleId: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true
        }
      }),
      prisma.role.findMany(),
      prisma.permission.findMany(),
      prisma.rolePermission.findMany(),
      prisma.student.findMany(),
      prisma.teacher.findMany(),
      prisma.subject.findMany(),
      prisma.teacherSubject.findMany(),
      prisma.course.findMany(),
      prisma.courseSession.findMany(),
      prisma.courseContent.findMany(),
      prisma.courseAllocation.findMany(),
      prisma.classSectionAllocation.findMany(),
      prisma.classSectionParticipant.findMany(),
      prisma.platoonEmailHistory.findMany(),
      prisma.grade.findMany(),
      prisma.registration.findMany(),
      prisma.room.findMany(),
      prisma.roomAllocation.findMany(),
      prisma.setting.findMany(),
      prisma.systemConfig.findMany(),
      prisma.notification.findMany(),
      prisma.message.findMany(),
      prisma.smsVerification.findMany(),
      prisma.loginAttempt.findMany(),
      prisma.calendarEvent.findMany()
    ])

    const settingsExport = settings.map(s => ({
      id: s.id,
      category: s.category,
      key: s.key,
      name: s.name,
      value: s.value,
      type: s.type,
      options: s.options,
      description: s.description,
      isSystem: s.isSystem,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }))

    const backup = {
      timestamp: exportedAt,
      data: {
        system_info: {
          app: 'Mopgom Theological Seminary Admin',
          version: process.env.APP_VERSION || null,
          db_provider: 'sqlite',
          exported_by: { id: currentAdmin.id, email: currentAdmin.email, name: currentAdmin.name, role: currentAdmin.role?.name || null }
        },
        admins,
        users,
        roles,
        permissions,
        role_permissions: rolePermissions,
        students,
        teachers,
        subjects,
        teacher_subjects: teacherSubjects,
        courses,
        course_sessions: courseSessions,
        course_contents: courseContents,
        course_allocations: courseAllocations,
        class_section_allocations: classSectionAllocations,
        class_section_participants: classSectionParticipants,
        platoon_email_history: platoonEmailHistory,
        grades,
        registrations,
        rooms,
        room_allocations: roomAllocations,
        settings: settingsExport,
        system_config: systemConfig,
        notifications,
        messages,
        sms_verifications: smsVerifications,
        login_attempts: loginAttempts,
        calendar_events: calendarEvents
      }
    }

    const filename = `system-backup-${exportedAt.split('T')[0]}.json`

    return NextResponse.json(backup, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create backup'
      },
      { status: 500 }
    )
  }
}