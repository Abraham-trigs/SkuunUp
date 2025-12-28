// app/api/exams/route.ts
// Purpose: List, search, paginate, and create exams scoped to authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
// IMPORT Prisma namespace for stable type access
import { Prisma } from "@prisma/client";

// -------------------- Schemas --------------------
const ExamCreateSchema = z.object({
  title: z.string().min(1, "Exam title is required"), // FIXED: Added mandatory title field
  studentId: z.string().cuid(),
  subjectId: z.string().cuid(),
  score: z.preprocess((val) => parseFloat(val as string), z.number()),
  maxScore: z.preprocess((val) => parseFloat(val as string), z.number()),
  date: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
});

const QuerySchema = z.object({
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)),
  perPage: z.preprocess((val) => Number(val ?? 20), z.number().min(1)),
  search: z.string().optional(),
  studentId: z.string().optional(),
});

// -------------------- GET exams --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = QuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    const skip = (query.page - 1) * query.perPage;

    // FIXED: Use Prisma.ExamWhereInput to satisfy the Next.js 15.5.5 type-checker
    const where: Prisma.ExamWhereInput = {
      student: { schoolId: schoolAccount.schoolId },
      ...(query.search ? { subject: { name: { contains: query.search, mode: "insensitive" } } } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
    };

    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        include: { student: true, subject: true },
        skip,
        take: query.perPage,
        orderBy: { date: "desc" },
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({ data: exams, total, page: query.page, perPage: query.perPage });
  } catch (err: any) {
    // FIXED: Use .issues for Zod v4 compatibility
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues }, { status: 400 });

    console.error("GET /api/exams error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST create exam --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = ExamCreateSchema.parse(body);

    // Ensure student belongs to authenticated school
    const student = await prisma.student.findUnique({
      where: { id: parsed.studentId },
      select: { schoolId: true },
    });

    if (!student || student.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Student not found in your school" }, { status: 404 });

    const exam = await prisma.exam.create({
      // FIXED: 'parsed' now includes 'title' to satisfy Prisma mandatory field check
      data: parsed,
      include: { student: true, subject: true },
    });

    return NextResponse.json({ data: exam }, { status: 201 });
  } catch (err: any) {
    // FIXED: Use .issues for Zod v4 compatibility
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues }, { status: 400 });

    console.error("POST /api/exams error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
