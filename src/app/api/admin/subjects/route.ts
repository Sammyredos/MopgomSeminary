import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
    }

    const q = req.nextUrl.searchParams.get("q") || "";
    const isActiveOnly = req.nextUrl.searchParams.get("active") === "true";

    const where: any = {};
    if (isActiveOnly) where.isActive = true;
    if (q) where.OR = [
      { subjectName: { contains: q, mode: "insensitive" } },
      { subjectCode: { contains: q, mode: "insensitive" } },
    ];

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: [{ subjectName: "asc" }],
      select: { id: true, subjectName: true, subjectCode: true, isActive: true },
    });

    return NextResponse.json({ items: subjects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}