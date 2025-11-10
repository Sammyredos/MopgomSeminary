import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest, hasPermission, hasRole } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
    }

    if (auth.user.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const canManage = hasPermission(auth.user, "manage_courses");
    const isSuperAdmin = hasRole(auth.user, "Super Admin");
    if (!canManage && !isSuperAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id: courseId, contentId } = await params;

    // Ensure course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Ensure content exists and belongs to course
    const existing = await (prisma as any).courseContent.findUnique({ where: { id: contentId } });
    if (!existing || existing.courseId !== courseId) {
      return NextResponse.json({ error: "Content not found for this course" }, { status: 404 });
    }

    const body = await req.json();
    const {
      subjectId,
      subjectLabel,
      title,
      contentType,
      url,
      description,
      additionalInfo,
      orderIndex,
      isPublished,
    } = body;

    if (title && typeof title !== "string") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    if (contentType && ["youtube", "audio", "pdf", "link", "text"].includes(contentType) === false) {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
    }
    if (contentType && contentType !== "text" && url && typeof url !== "string") {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    const data: any = {};
    if (typeof title === "string") data.title = title.trim();
    if (typeof contentType === "string") data.contentType = contentType;
    if (typeof subjectId !== "undefined") data.subjectId = subjectId || null;
    if (typeof subjectLabel !== "undefined") data.subjectLabel = subjectLabel || null;
    if (typeof description !== "undefined") data.description = description || null;
    if (typeof isPublished === "boolean") data.isPublished = isPublished;
    if (typeof orderIndex !== "undefined") {
      data.orderIndex = typeof orderIndex === "number" ? orderIndex : parseInt(String(orderIndex), 10) || 0;
    }
    // Content body/url handling
    if (data.contentType === "text") {
      data.url = null;
      data.additionalInfo = typeof additionalInfo === "string" ? additionalInfo : existing.additionalInfo || null;
    } else if (typeof url !== "undefined") {
      data.url = url || null;
      // Preserve additionalInfo if not text
      if (typeof additionalInfo !== "undefined") {
        data.additionalInfo = additionalInfo || null;
      }
    }

    try {
      const updated = await (prisma as any).courseContent.update({
        where: { id: contentId },
        data,
      });
      return NextResponse.json({ item: updated });
    } catch (err: any) {
      const code = (err as Prisma.PrismaClientKnownRequestError)?.code || undefined;
      const msg = String(err?.message || err || "").toLowerCase();
      if (code === "P2021" || msg.includes("no such table") || msg.includes("does not exist")) {
        return NextResponse.json({ error: "Course content storage not initialized. Please run Prisma migrations." }, { status: 400 });
      }
      throw err;
    }
  } catch (error: any) {
    console.error("PUT /admin/courses/[id]/contents/[contentId] error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
    }

    if (auth.user.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const canManage = hasPermission(auth.user, "manage_courses");
    const isSuperAdmin = hasRole(auth.user, "Super Admin");
    if (!canManage && !isSuperAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id: courseId, contentId } = await params;

    // Ensure content exists and belongs to course
    const existing = await (prisma as any).courseContent.findUnique({ where: { id: contentId } });
    if (!existing || existing.courseId !== courseId) {
      return NextResponse.json({ error: "Content not found for this course" }, { status: 404 });
    }

    try {
      await (prisma as any).courseContent.delete({ where: { id: contentId } });
      return NextResponse.json({ success: true });
    } catch (err: any) {
      const code = (err as Prisma.PrismaClientKnownRequestError)?.code || undefined;
      const msg = String(err?.message || err || "").toLowerCase();
      if (code === "P2021" || msg.includes("no such table") || msg.includes("does not exist")) {
        return NextResponse.json({ error: "Course content storage not initialized. Please run Prisma migrations." }, { status: 400 });
      }
      throw err;
    }
  } catch (error: any) {
    console.error("DELETE /admin/courses/[id]/contents/[contentId] error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}