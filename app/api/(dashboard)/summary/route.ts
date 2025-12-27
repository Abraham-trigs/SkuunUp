// app/api/(dashboard)/summary/route.ts
// Purpose: Provide paginated, filtered summary of exams per school for dashboard

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// -------------------- Schemas --------------------
const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  studentId: z.string().optional(),
});

// -------------------- Helper --------------------
function formatStudentName(user: { firstName?: string; surname?: string; otherNames?: string }): string {
  return [user.firstName, user.surname, user.otherNames].filter(Boolean).join(" ");
}

// -------------------- GET Dashboard Summary --------------------
export async function GET(req: NextRequest) {
  try {
    // Auth via SchoolAccount (argument-free init)
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parse and normalize query params
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const page = Math.max(Number(query.page ?? 1), 1);
    const perPage = Math.max(Number(query.perPage ?? 20), 1);
    const skip = (page - 1) * perPage;
    const search = query.search?.trim() || undefined;
    const studentId = query.studentId || undefined;

    // Prisma where clause scoped to school
    const where: Parameters<typeof prisma.exam.findMany>[0]["where"] = {
      student: { class: { schoolId: schoolAccount.schoolId } },
      ...(search ? { subject: { name: { contains: search, mode: "insensitive" } } } : {}),
      ...(studentId ? { studentId } : {}),
    };

    // Fetch exams and total count in a single transaction
    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        skip,
        take: perPage,
        orderBy: { date: "desc" },
      }),
      prisma.exam.count({ where }),
    ]);

    // Map exams to frontend DTO
    const data = exams.map((e) => ({
      id: e.id,
      score: e.score,
      maxScore: e.maxScore,
      date: e.date,
      subject: e.subject,
      student: {
        id: e.student.id,
        name: formatStudentName(e.student.user),
        email: e.student.user.email,
      },
    }));

    return NextResponse.json({ data, total, page, perPage });
  } catch (err: any) {
    console.error("Dashboard summary error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- Enforces school-scoped queries using argument-free SchoolAccount.init()
- Normalizes and validates query params with Zod
- Returns DTOs with student full names and subject info, consistent for frontend

Structure:
- GET(): main handler
- Auth handled via SchoolAccount.init()
- Prisma $transaction ensures exams + count consistency
- Helper for student name formatting

Implementation guidance:
- Drop this file into (dashboard)/summary
- Frontend can query with ?page=&perPage=&search=&studentId=
- Handles 401, 400 (Zod), and 500 consistently

Scalability insight:
- Easy to add filters like subjectId, gradeId, or exam type
- Keeps single DTO format; pagination scales for large datasets
- Can add caching layer without touching core logic
*/
