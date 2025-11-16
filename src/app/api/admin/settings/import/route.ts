/**
 * Enhanced Settings Import API
 * POST /api/admin/settings/import
 * Imports settings from backup files with email configuration support
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { Logger } from '@/lib/logger'
import { prisma } from '@/lib/db'

const logger = Logger('Settings-Import')

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Determine if this is an admin or user based on the token type
    const userType = payload.type || 'admin'

    let user
    if (userType === 'admin') {
      user = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        include: { role: true }
      })
    } else {
      user = await prisma.user.findUnique({
        where: { id: payload.adminId },
        include: { role: true }
      })
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    // Check if user has Super Admin privileges (import is more sensitive)
    if (user.role?.name !== 'Super Admin') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a JSON file.' }, { status: 400 })
    }

    const fileContent = await file.text()
    let backupData
    try {
      backupData = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 })
    }
    if (!backupData.data || !backupData.timestamp) {
      return NextResponse.json({ error: 'Invalid backup file structure' }, { status: 400 })
    }

    const d = backupData.data

    let importedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []
    const importResults: Array<{ entity: string; id?: string; action: 'imported' | 'updated' | 'skipped'; reason?: string }> = []

    if (d.roles && Array.isArray(d.roles)) {
      for (const item of d.roles) {
        try {
          await prisma.role.upsert({
            where: { id: item.id },
            update: { name: item.name, description: item.description, isSystem: item.isSystem },
            create: { id: item.id, name: item.name, description: item.description, isSystem: item.isSystem, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'roles', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('roles:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'roles', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.permissions && Array.isArray(d.permissions)) {
      for (const item of d.permissions) {
        try {
          await prisma.permission.upsert({
            where: { id: item.id },
            update: { name: item.name, description: item.description, resource: item.resource, action: item.action },
            create: { id: item.id, name: item.name, description: item.description, resource: item.resource, action: item.action }
          })
          updatedCount++
          importResults.push({ entity: 'permissions', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('permissions:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'permissions', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.role_permissions || d.rolePermissions) && Array.isArray(d.role_permissions || d.rolePermissions)) {
      for (const item of (d.role_permissions || d.rolePermissions)) {
        try {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: item.roleId, permissionId: item.permissionId } },
            update: {},
            create: { id: item.id, roleId: item.roleId, permissionId: item.permissionId }
          })
          updatedCount++
          importResults.push({ entity: 'role_permissions', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('role_permissions:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'role_permissions', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.subjects && Array.isArray(d.subjects)) {
      for (const item of d.subjects) {
        try {
          await prisma.subject.upsert({
            where: { id: item.id },
            update: { subjectCode: item.subjectCode, subjectName: item.subjectName, description: item.description, credits: item.credits, isActive: item.isActive },
            create: { id: item.id, subjectCode: item.subjectCode, subjectName: item.subjectName, description: item.description, credits: item.credits, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'subjects', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('subjects:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'subjects', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.teachers && Array.isArray(d.teachers)) {
      for (const item of d.teachers) {
        try {
          await prisma.teacher.upsert({
            where: { id: item.id },
            update: { teacherId: item.teacherId, fullName: item.fullName, email: item.email, phone: item.phone, subject: item.subject, hireDate: item.hireDate, isActive: item.isActive },
            create: { id: item.id, teacherId: item.teacherId, fullName: item.fullName, email: item.email, phone: item.phone, subject: item.subject, hireDate: item.hireDate, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'teachers', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('teachers:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'teachers', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.teacher_subjects || d.teacherSubjects) && Array.isArray(d.teacher_subjects || d.teacherSubjects)) {
      for (const item of (d.teacher_subjects || d.teacherSubjects)) {
        try {
          await prisma.teacherSubject.upsert({
            where: { teacherId_subjectId: { teacherId: item.teacherId, subjectId: item.subjectId } },
            update: {},
            create: { id: item.id, teacherId: item.teacherId, subjectId: item.subjectId, createdAt: item.createdAt }
          })
          updatedCount++
          importResults.push({ entity: 'teacher_subjects', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('teacher_subjects:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'teacher_subjects', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.courses && Array.isArray(d.courses)) {
      for (const item of d.courses) {
        try {
          await prisma.course.upsert({
            where: { id: item.id },
            update: { courseCode: item.courseCode, courseName: item.courseName, subjectArea: item.subjectArea, instructor: item.instructor, maxStudents: item.maxStudents, currentEnrollment: item.currentEnrollment, duration: item.duration, platform: item.platform, meetingUrl: item.meetingUrl, prerequisites: item.prerequisites, description: item.description, isActive: item.isActive },
            create: { id: item.id, courseCode: item.courseCode, courseName: item.courseName, subjectArea: item.subjectArea, instructor: item.instructor, maxStudents: item.maxStudents, currentEnrollment: item.currentEnrollment, duration: item.duration, platform: item.platform, meetingUrl: item.meetingUrl, prerequisites: item.prerequisites, description: item.description, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'courses', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('courses:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'courses', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.course_sessions || d.courseSessions) && Array.isArray(d.course_sessions || d.courseSessions)) {
      for (const item of (d.course_sessions || d.courseSessions)) {
        try {
          await prisma.courseSession.upsert({
            where: { id: item.id },
            update: { subjectId: item.subjectId, teacherId: item.teacherId, courseId: item.courseId, startTime: item.startTime, endTime: item.endTime, dayOfWeek: item.dayOfWeek, isActive: item.isActive },
            create: { id: item.id, subjectId: item.subjectId, teacherId: item.teacherId, courseId: item.courseId, startTime: item.startTime, endTime: item.endTime, dayOfWeek: item.dayOfWeek, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'course_sessions', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('course_sessions:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'course_sessions', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.course_contents || d.courseContents) && Array.isArray(d.course_contents || d.courseContents)) {
      for (const item of (d.course_contents || d.courseContents)) {
        try {
          await prisma.courseContent.upsert({
            where: { id: item.id },
            update: { courseId: item.courseId, subjectId: item.subjectId, subjectLabel: item.subjectLabel, title: item.title, contentType: item.contentType, url: item.url, description: item.description, additionalInfo: item.additionalInfo, orderIndex: item.orderIndex, isPublished: item.isPublished, createdById: item.createdById },
            create: { id: item.id, courseId: item.courseId, subjectId: item.subjectId, subjectLabel: item.subjectLabel, title: item.title, contentType: item.contentType, url: item.url, description: item.description, additionalInfo: item.additionalInfo, orderIndex: item.orderIndex, isPublished: item.isPublished, createdById: item.createdById, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'course_contents', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('course_contents:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'course_contents', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.course_allocations || d.courseAllocations) && Array.isArray(d.course_allocations || d.courseAllocations)) {
      for (const item of (d.course_allocations || d.courseAllocations)) {
        try {
          await prisma.courseAllocation.upsert({
            where: { studentId: item.studentId },
            update: { courseId: item.courseId, allocatedAt: item.allocatedAt, allocatedBy: item.allocatedBy, isActive: item.isActive },
            create: { id: item.id, studentId: item.studentId, courseId: item.courseId, allocatedAt: item.allocatedAt, allocatedBy: item.allocatedBy, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'course_allocations', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('course_allocations:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'course_allocations', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.students && Array.isArray(d.students)) {
      for (const item of d.students) {
        try {
          await prisma.student.upsert({
            where: { id: item.id },
            update: {
              studentId: item.studentId,
              matriculationNumber: item.matriculationNumber,
              fullName: item.fullName,
              dateOfBirth: item.dateOfBirth,
              age: item.age,
              gender: item.gender,
              address: item.address,
              grade: item.grade,
              phoneNumber: item.phoneNumber,
              emailAddress: item.emailAddress,
              emergencyContactName: item.emergencyContactName,
              emergencyContactRelationship: item.emergencyContactRelationship,
              emergencyContactPhone: item.emergencyContactPhone,
              parentGuardianName: item.parentGuardianName,
              parentGuardianPhone: item.parentGuardianPhone,
              parentGuardianEmail: item.parentGuardianEmail,
              enrollmentDate: item.enrollmentDate,
              graduationYear: item.graduationYear,
              currentClass: item.currentClass,
              medications: item.medications,
              allergies: item.allergies,
              specialNeeds: item.specialNeeds,
              dietaryRestrictions: item.dietaryRestrictions,
              parentalPermissionGranted: item.parentalPermissionGranted,
              parentalPermissionDate: item.parentalPermissionDate,
              isActive: item.isActive,
              academicYear: item.academicYear,
              qrCode: item.qrCode,
              attendanceMarked: item.attendanceMarked,
              attendanceMarkedAt: item.attendanceMarkedAt,
              attendanceMarkedBy: item.attendanceMarkedBy
            },
            create: { ...item }
          })
          updatedCount++
          importResults.push({ entity: 'students', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('students:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'students', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.registrations || d.registration) && Array.isArray(d.registrations || d.registration)) {
      for (const item of (d.registrations || d.registration)) {
        try {
          await prisma.registration.upsert({
            where: { id: item.id },
            update: {
              fullName: item.fullName,
              dateOfBirth: item.dateOfBirth,
              age: item.age,
              gender: item.gender,
              address: item.address,
              officePostalAddress: item.officePostalAddress,
              branch: item.branch,
              phoneNumber: item.phoneNumber,
              emailAddress: item.emailAddress,
              matriculationNumber: item.matriculationNumber,
              courseDesired: item.courseDesired,
              maritalStatus: item.maritalStatus,
              spouseName: item.spouseName,
              placeOfBirth: item.placeOfBirth,
              origin: item.origin,
              presentOccupation: item.presentOccupation,
              placeOfWork: item.placeOfWork,
              positionHeldInOffice: item.positionHeldInOffice,
              acceptedJesusChrist: item.acceptedJesusChrist,
              whenAcceptedJesus: item.whenAcceptedJesus,
              churchAffiliation: item.churchAffiliation,
              schoolsAttended: item.schoolsAttended,
              emergencyContactName: item.emergencyContactName,
              emergencyContactRelationship: item.emergencyContactRelationship,
              emergencyContactPhone: item.emergencyContactPhone,
              parentGuardianName: item.parentGuardianName,
              parentGuardianPhone: item.parentGuardianPhone,
              parentGuardianEmail: item.parentGuardianEmail,
              parentalPermissionGranted: item.parentalPermissionGranted,
              parentalPermissionDate: item.parentalPermissionDate,
              isVerified: item.isVerified,
              verifiedAt: item.verifiedAt,
              verifiedBy: item.verifiedBy
            },
            create: { ...item }
          })
          updatedCount++
          importResults.push({ entity: 'registrations', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('registrations:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'registrations', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.rooms && Array.isArray(d.rooms)) {
      for (const item of d.rooms) {
        try {
          await prisma.room.upsert({
            where: { id: item.id },
            update: { name: item.name, gender: item.gender, capacity: item.capacity, description: item.description, isActive: item.isActive },
            create: { id: item.id, name: item.name, gender: item.gender, capacity: item.capacity, description: item.description, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'rooms', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('rooms:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'rooms', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.room_allocations || d.roomAllocations) && Array.isArray(d.room_allocations || d.roomAllocations)) {
      for (const item of (d.room_allocations || d.roomAllocations)) {
        try {
          await prisma.roomAllocation.upsert({
            where: { registrationId: item.registrationId },
            update: { roomId: item.roomId, allocatedAt: item.allocatedAt, allocatedBy: item.allocatedBy, metadata: item.metadata, isActive: item.isActive },
            create: { id: item.id, registrationId: item.registrationId, roomId: item.roomId, allocatedAt: item.allocatedAt, allocatedBy: item.allocatedBy, metadata: item.metadata, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'room_allocations', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('room_allocations:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'room_allocations', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.class_section_allocations || d.classSectionAllocations) && Array.isArray(d.class_section_allocations || d.classSectionAllocations)) {
      for (const item of (d.class_section_allocations || d.classSectionAllocations)) {
        try {
          await prisma.classSectionAllocation.upsert({
            where: { id: item.id },
            update: { studentId: item.studentId, classSectionName: item.classSectionName, allocatedAt: item.allocatedAt, allocatedBy: item.allocatedBy, isActive: item.isActive },
            create: { id: item.id, studentId: item.studentId, classSectionName: item.classSectionName, allocatedAt: item.allocatedAt, allocatedBy: item.allocatedBy, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'class_section_allocations', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('class_section_allocations:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'class_section_allocations', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.class_section_participants || d.classSectionParticipants) && Array.isArray(d.class_section_participants || d.classSectionParticipants)) {
      for (const item of (d.class_section_participants || d.classSectionParticipants)) {
        try {
          await prisma.classSectionParticipant.upsert({
            where: { id: item.id },
            update: { studentId: item.studentId, classSectionId: item.classSectionId, joinedAt: item.joinedAt, isActive: item.isActive },
            create: { id: item.id, studentId: item.studentId, classSectionId: item.classSectionId, joinedAt: item.joinedAt, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'class_section_participants', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('class_section_participants:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'class_section_participants', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.platoon_email_history || d.platoonEmailHistory) && Array.isArray(d.platoon_email_history || d.platoonEmailHistory)) {
      for (const item of (d.platoon_email_history || d.platoonEmailHistory)) {
        try {
          await prisma.platoonEmailHistory.upsert({
            where: { id: item.id },
            update: { platoonId: item.platoonId, subject: item.subject, message: item.message, emailTarget: item.emailTarget, recipientCount: item.recipientCount, successCount: item.successCount, failedCount: item.failedCount, sentBy: item.sentBy, senderName: item.senderName, senderEmail: item.senderEmail },
            create: { id: item.id, platoonId: item.platoonId, subject: item.subject, message: item.message, emailTarget: item.emailTarget, recipientCount: item.recipientCount, successCount: item.successCount, failedCount: item.failedCount, sentBy: item.sentBy, senderName: item.senderName, senderEmail: item.senderEmail, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'platoon_email_history', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('platoon_email_history:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'platoon_email_history', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.grades && Array.isArray(d.grades)) {
      for (const item of d.grades) {
        try {
          await prisma.grade.upsert({
            where: { id: item.id },
            update: { studentId: item.studentId, subjectId: item.subjectId, teacherId: item.teacherId, gradeValue: item.gradeValue, maxGrade: item.maxGrade, gradeType: item.gradeType, description: item.description, gradedAt: item.gradedAt },
            create: { id: item.id, studentId: item.studentId, subjectId: item.subjectId, teacherId: item.teacherId, gradeValue: item.gradeValue, maxGrade: item.maxGrade, gradeType: item.gradeType, description: item.description, gradedAt: item.gradedAt, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'grades', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('grades:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'grades', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.messages && Array.isArray(d.messages)) {
      for (const item of d.messages) {
        try {
          await prisma.message.upsert({
            where: { id: item.id },
            update: { subject: item.subject, content: item.content, senderEmail: item.senderEmail, senderName: item.senderName, recipientEmail: item.recipientEmail, recipientName: item.recipientName, senderType: item.senderType, recipientType: item.recipientType, status: item.status, error: item.error, sentAt: item.sentAt, deliveredAt: item.deliveredAt, readAt: item.readAt },
            create: { id: item.id, subject: item.subject, content: item.content, senderEmail: item.senderEmail, senderName: item.senderName, recipientEmail: item.recipientEmail, recipientName: item.recipientName, senderType: item.senderType, recipientType: item.recipientType, status: item.status, error: item.error, sentAt: item.sentAt, deliveredAt: item.deliveredAt, readAt: item.readAt, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'messages', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('messages:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'messages', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.calendar_events || d.calendarEvents) && Array.isArray(d.calendar_events || d.calendarEvents)) {
      for (const item of (d.calendar_events || d.calendarEvents)) {
        try {
          await prisma.calendarEvent.upsert({
            where: { id: item.id },
            update: { title: item.title, description: item.description, eventType: item.eventType, startDate: item.startDate, endDate: item.endDate, isRecurring: item.isRecurring, recurrencePattern: item.recurrencePattern, academicYear: item.academicYear, isActive: item.isActive },
            create: { id: item.id, title: item.title, description: item.description, eventType: item.eventType, startDate: item.startDate, endDate: item.endDate, isRecurring: item.isRecurring, recurrencePattern: item.recurrencePattern, academicYear: item.academicYear, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'calendar_events', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('calendar_events:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'calendar_events', id: item.id, action: 'skipped' })
        }
      }
    }

    if (d.settings && Array.isArray(d.settings)) {
      for (const setting of d.settings) {
        try {
          const existingSetting = await prisma.setting.findFirst({
            where: { category: setting.category, key: setting.key }
          })
          if (existingSetting) {
            await prisma.setting.update({
              where: { id: existingSetting.id },
              data: { name: setting.name, value: setting.value, type: setting.type, description: setting.description || existingSetting.description, options: setting.options || existingSetting.options }
            })
            updatedCount++
            importResults.push({ entity: 'settings', id: existingSetting.id, action: 'updated' })
          } else {
            await prisma.setting.create({
              data: { category: setting.category, key: setting.key, name: setting.name, value: setting.value, type: setting.type, description: setting.description || '', options: setting.options, isSystem: setting.isSystem || false }
            })
            importedCount++
            importResults.push({ entity: 'settings', id: setting.key, action: 'imported' })
          }
        } catch (e) {
          errors.push('settings:' + (setting.key || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'settings', id: setting.key, action: 'skipped' })
        }
      }
    }

    if (d.system_config && Array.isArray(d.system_config)) {
      for (const item of d.system_config) {
        try {
          await prisma.systemConfig.upsert({
            where: { key: item.key },
            update: { value: item.value, description: item.description },
            create: { id: item.id, key: item.key, value: item.value, description: item.description, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'system_config', id: item.key, action: 'updated' })
        } catch (e) {
          errors.push('system_config:' + (item.key || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'system_config', id: item.key, action: 'skipped' })
        }
      }
    }

    if ((d.sms_verifications || d.smsVerifications) && Array.isArray(d.sms_verifications || d.smsVerifications)) {
      for (const item of (d.sms_verifications || d.smsVerifications)) {
        try {
          await prisma.smsVerification.upsert({
            where: { id: item.id },
            update: { phoneNumber: item.phoneNumber, code: item.code, expiresAt: item.expiresAt, attempts: item.attempts, verified: item.verified },
            create: { id: item.id, phoneNumber: item.phoneNumber, code: item.code, expiresAt: item.expiresAt, attempts: item.attempts, verified: item.verified, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'sms_verifications', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('sms_verifications:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'sms_verifications', id: item.id, action: 'skipped' })
        }
      }
    }

    if ((d.login_attempts || d.loginAttempts) && Array.isArray(d.login_attempts || d.loginAttempts)) {
      for (const item of (d.login_attempts || d.loginAttempts)) {
        try {
          await prisma.loginAttempt.upsert({
            where: { email_ip: { email: item.email, ipAddress: item.ipAddress } },
            update: { attempts: item.attempts, lastAttempt: item.lastAttempt, lockedUntil: item.lockedUntil },
            create: { id: item.id, email: item.email, ipAddress: item.ipAddress, attempts: item.attempts, lastAttempt: item.lastAttempt, lockedUntil: item.lockedUntil, createdAt: item.createdAt, updatedAt: item.updatedAt }
          })
          updatedCount++
          importResults.push({ entity: 'login_attempts', id: item.id, action: 'updated' })
        } catch (e) {
          errors.push('login_attempts:' + (item.id || 'unknown'))
          skippedCount++
          importResults.push({ entity: 'login_attempts', id: item.id, action: 'skipped' })
        }
      }
    }

    const emailSettings = await prisma.setting.findMany({ where: { category: 'email' } })
    const emailSettingsMap = emailSettings.reduce((acc, setting) => {
      try {
        acc[setting.key] = JSON.parse(setting.value)
      } catch {
        acc[setting.key] = setting.value
      }
      return acc
    }, {} as Record<string, any>)
    const isEmailConfigured = !!(emailSettingsMap.smtpHost && emailSettingsMap.smtpUser && emailSettingsMap.smtpPass)

    logger.info('Settings import completed', {
      userId: user.id,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errors.length,
      emailConfigured: isEmailConfigured
    })

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      summary: {
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: importedCount + updatedCount + skippedCount,
        errors: errors.length
      },
      email_status: {
        configured: isEmailConfigured,
        smtp_host: emailSettingsMap.smtpHost || null,
        smtp_user: emailSettingsMap.smtpUser || null,
        from_name: emailSettingsMap.emailFromName || null,
        has_password: !!emailSettingsMap.smtpPass
      },
      results: importResults,
      errors: errors.length > 0 ? errors : undefined,
      backup_info: backupData.data.system_info || null,
      importedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  } finally {
  }
}
