/*
  Warnings:

  - You are about to drop the `class_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classroom_allocations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classrooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "class_sessions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "classroom_allocations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "classrooms";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "subjectArea" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "meetingUrl" TEXT,
    "prerequisites" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "course_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "allocatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allocatedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_allocations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_allocations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_sessions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_courseCode_key" ON "courses"("courseCode");

-- CreateIndex
CREATE UNIQUE INDEX "course_allocations_studentId_key" ON "course_allocations"("studentId");

-- CreateIndex
CREATE INDEX "course_allocations_studentId_idx" ON "course_allocations"("studentId");

-- CreateIndex
CREATE INDEX "course_allocations_courseId_idx" ON "course_allocations"("courseId");

-- CreateIndex
CREATE INDEX "course_allocations_allocatedAt_idx" ON "course_allocations"("allocatedAt");

-- CreateIndex
CREATE INDEX "course_allocations_isActive_idx" ON "course_allocations"("isActive");

-- CreateIndex
CREATE INDEX "course_sessions_subjectId_idx" ON "course_sessions"("subjectId");

-- CreateIndex
CREATE INDEX "course_sessions_teacherId_idx" ON "course_sessions"("teacherId");

-- CreateIndex
CREATE INDEX "course_sessions_courseId_idx" ON "course_sessions"("courseId");

-- CreateIndex
CREATE INDEX "course_sessions_startTime_idx" ON "course_sessions"("startTime");

-- CreateIndex
CREATE INDEX "course_sessions_dayOfWeek_idx" ON "course_sessions"("dayOfWeek");
