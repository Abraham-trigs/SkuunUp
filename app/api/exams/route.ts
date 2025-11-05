// app/api/exams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const ExamCreateSchema = z.object({
  studentId: z.string().cuid(),
  subjectId: z.string().cuid(),
  score: z.preprocess((val) => parseFloat(val as string), z.number()),
  maxScore: z.preprocess((val) => parseFloat(val as string), z.number()),
  date: z.preprocess((val) => new Date(val as string), z.date()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await cookieUser(req);
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const studentId = url.searchParams.get("studentId");
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.subject = { name: { contains: search, mode: "insensitive" } };
    if (studentId) where.studentId = studentId;

    const exams = await prisma.exam.findMany({
      where,
      include: { student: true, subject: true },
      skip,
      take: limit,
      orderBy: { date: "desc" },
    });

    const total = await prisma.exam.count({ where });

    return NextResponse.json({ data: exams, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await cookieUser(req);
    const body = await req.json();
    const parsed = ExamCreateSchema.parse(body);

    const exam = await prisma.exam.create({
      data: {
        studentId: parsed.studentId,
        subjectId: parsed.subjectId,
        score: parsed.score,
        maxScore: parsed.maxScore,
        date: parsed.date,
      },
      include: { student: true, subject: true },
    });
    return NextResponse.json({ data: exam });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
