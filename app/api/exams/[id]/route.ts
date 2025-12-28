// app/api/exams/[id]/route.ts
// Purpose: Fetch, update, or delete a single exam scoped to authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { Role } from "@/generated/prisma"; 

// -------------------- Schemas --------------------
const ExamUpdateSchema = z.object({
  subjectId: z.string().cuid().optional(),
  score: z.preprocess((val) => (val !== undefined ? parseFloat(val as string) : undefined), z.number().optional()),
  maxScore: z.preprocess((val) => (val !== undefined ? parseFloat(val as string) : undefined), z.number().optional()),
  date: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
});

// -------------------- Helpers --------------------
const canModifyExam = (role: Role) => (["TEACHER", "ASSISTANT_TEACHER", "EXAM_OFFICER"] as string[]).includes(role);

// -------------------- GET /:id --------------------
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // NEXT 15: Async params
) {
  try {
    const { id } = await params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { student: true, subject: true },
    });

    // FIXED: Added optional chaining (?.) to student relation for strict null checks
    if (!exam || exam.student?.schoolId !== schoolAccount.schoolId)      
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    return NextResponse.json({ data: exam });
  } catch (err: any) {
    console.error("GET /api/exams/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- PUT /:id --------------------
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // NEXT 15: Async params
) {
  try {
    const { id } = await params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canModifyExam(schoolAccount.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = ExamUpdateSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.findUnique({
        where: { id },
        include: { student: true, subject: true },
      });

      // FIXED: Added optional chaining (?.) to student relation
      if (!exam || exam.student?.schoolId !== schoolAccount.schoolId)
        throw new Error("Exam not found or does not belong to your school");

      return tx.exam.update({
        where: { id },
        data: parsed,
        include: { student: true, subject: true },
      });
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    // FIXED: Use .issues for Zod v4 compatibility in 2025 builds
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });

    console.error("PUT /api/exams/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- DELETE /:id --------------------
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // NEXT 15: Async params
) {
  try {
    const { id } = await params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canModifyExam(schoolAccount.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { student: true },
    });

    // FIXED: Added optional chaining (?.) to student relation
    if (!exam || exam.student?.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Exam not found or not in your school" }, { status: 404 });

    await prisma.exam.delete({ where: { id } });

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (err: any) {
    console.error("DELETE /api/exams/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
