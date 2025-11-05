// app/api/exams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const ExamUpdateSchema = z.object({
  subjectId: z.string().cuid().optional(),
  score: z.preprocess((val) => parseFloat(val as string), z.number()).optional(),
  maxScore: z.preprocess((val) => parseFloat(val as string), z.number()).optional(),
  date: z.preprocess((val) => new Date(val as string), z.date()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await cookieUser(req);
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { student: true, subject: true },
    });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    return NextResponse.json({ data: exam });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await cookieUser(req);
    const body = await req.json();
    const parsed = ExamUpdateSchema.parse(body);

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: parsed,
      include: { student: true, subject: true },
    });
    return NextResponse.json({ data: exam });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await cookieUser(req);
    await prisma.exam.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id, deleted: true } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
