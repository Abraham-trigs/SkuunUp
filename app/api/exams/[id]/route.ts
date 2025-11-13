// app/api/exams/[id]/route.ts
// Handles fetching, updating, and deleting a single exam with auth, validation, and safety checks

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";
import { Role } from "@prisma/client";

// Zod schema for updating exams
const ExamUpdateSchema = z.object({
  subjectId: z.string().cuid().optional(),
  score: z.preprocess(
    (val) => (val !== undefined ? parseFloat(val as string) : undefined),
    z.number().optional()
  ),
  maxScore: z.preprocess(
    (val) => (val !== undefined ? parseFloat(val as string) : undefined),
    z.number().optional()
  ),
  date: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
});

// Role check helper
const canModifyExam = (role: Role) =>
  ["TEACHER", "ASSISTANT_TEACHER", "EXAM_OFFICER"].includes(role);

// -------------------- GET --------------------
export async function GET(req: NextRequest, { params }: { params: { id?: string } }) {
  try {
    await cookieUser(req);

    if (!params?.id) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { student: true, subject: true },
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    return NextResponse.json({ data: exam });
  } catch (err: any) {
    console.error("GET /api/exams/:id error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch exam" }, { status: 500 });
  }
}

// -------------------- PUT --------------------
export async function PUT(req: NextRequest, { params }: { params: { id?: string } }) {
  try {
    const user = await cookieUser(req);
    if (!canModifyExam(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!params?.id) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = ExamUpdateSchema.parse(body);

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: parsed,
      include: { student: true, subject: true },
    });

    return NextResponse.json({ data: exam });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("PUT /api/exams/:id error:", err);
    return NextResponse.json({ error: err.message || "Failed to update exam" }, { status: 500 });
  }
}

// -------------------- DELETE --------------------
export async function DELETE(req: NextRequest, { params }: { params: { id?: string } }) {
  try {
    const user = await cookieUser(req);
    if (!canModifyExam(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!params?.id) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    await prisma.exam.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id, deleted: true } });
  } catch (err: any) {
    console.error("DELETE /api/exams/:id error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete exam" }, { status: 500 });
  }
}
