import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest, hasPermission, hasRole } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
    }

    const { id: courseId } = await params;
    const subjectId = req.nextUrl.searchParams.get("subjectId") || undefined;
    const isPublishedOnly = req.nextUrl.searchParams.get("published") === "true";

    const where: any = { courseId };
    if (subjectId) where.subjectId = subjectId;
    if (isPublishedOnly) where.isPublished = true;

    let contents = [] as any[];
    try {
      // Cast to any to bypass stale Prisma type errors while client regenerates
      contents = await (prisma as any).courseContent.findMany({
        where,
        orderBy: [{ subjectLabel: "asc" }, { orderIndex: "asc" }, { createdAt: "desc" }],
      });
    } catch (err: any) {
      const code = (err as Prisma.PrismaClientKnownRequestError)?.code || undefined;
      const msg = String(err?.message || err || "").toLowerCase();
      // Gracefully handle missing table in dev or un-migrated environments
      if (code === "P2021" || msg.includes("no such table") || msg.includes("does not exist")) {
        console.warn("CourseContent table missing; returning empty items instead of 500.");
        return NextResponse.json({ items: [] }, { status: 200 });
      }
      throw err;
    }

    return NextResponse.json({ items: contents });
  } catch (error: any) {
    console.error("GET /admin/courses/[id]/contents error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
    }

    // Only admins can upload content
    if (auth.user.type !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Optional: permission gate
    const canManage = hasPermission(auth.user, "manage_courses");
    const isSuperAdmin = hasRole(auth.user, "Super Admin");
    if (!canManage && !isSuperAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id: courseId } = await params;
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

    if (!title || !contentType) {
      return NextResponse.json({ error: "title and contentType are required" }, { status: 400 });
    }

    if (["youtube", "audio", "pdf", "link", "text"].includes(contentType) === false) {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
    }

    if (["youtube", "audio", "pdf", "link"].includes(contentType) && !url) {
      return NextResponse.json({ error: "url is required for non-text content" }, { status: 400 });
    }

    // ensure course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // optional subject validation
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }
    }

    let created;
    try {
      // Cast to any to bypass stale Prisma type errors while client regenerates
      created = await (prisma as any).courseContent.create({
        data: {
          courseId,
          subjectId: subjectId || null,
          subjectLabel: subjectLabel || null,
          title,
          contentType,
          url: url || null,
          description: description || null,
          additionalInfo: additionalInfo || null,
          orderIndex: typeof orderIndex === "number" ? orderIndex : 0,
          isPublished: typeof isPublished === "boolean" ? isPublished : true,
          createdById: auth.user.id,
        },
      });
    } catch (err: any) {
      const code = (err as Prisma.PrismaClientKnownRequestError)?.code || undefined;
      const msg = String(err?.message || err || "").toLowerCase();
      if (code === "P2021" || msg.includes("no such table") || msg.includes("does not exist")) {
        return NextResponse.json({ error: "Course content storage not initialized. Please run Prisma migrations." }, { status: 400 });
      }
      throw err;
    }

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error: any) {
    console.error("POST /admin/courses/[id]/contents error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}