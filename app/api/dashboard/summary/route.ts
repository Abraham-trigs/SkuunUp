// app/api/exams/route.ts
// Handles fetching and creating exams with validation, pagination, and search

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

// Zod schema for creating exams
const ExamCreateSchema = z.object({
  studentId: z.string().cuid(),
  subjectId: z.string().cuid(),
  score: z.preprocess((val) => parseFloat(val as string), z.number()),
  maxScore: z.preprocess((val) => parseFloat(val as string), z.number()),
  date: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
});

/**
 * Design reasoning:
 * - Combines GET and POST for exams in a single route.
 * - GET supports search, student filter, pagination.
 * - POST validates and normalizes input before creation.
 */

/**
 * Structure:
 * - GET: fetch exams with search/pagination
 * - POST: create new exam
 */

export async function GET(req: NextRequest) {
  try {
    await cookieUser(req);

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const studentId = url.searchParams.get("studentId");
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.exam.findMany>[0]["where"] = {};
    if (search) where.subject = { name: { contains: search, mode: "insensitive" } };
    if (studentId) where.studentId = studentId;

    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        include: { student: true, subject: true },
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({ data: exams, total });
  } catch (err: any) {
    console.error("GET /api/exams error:", err);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await cookieUser(req);

    const body = await req.json();
    const parsed = ExamCreateSchema.parse(body);

    const exam = await prisma.exam.create({
      data: parsed,
      include: { student: true, subject: true },
    });

    return NextResponse.json({ data: exam });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("POST /api/exams error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Implementation guidance:
 * - Use GET with optional query params: search, studentId, page, limit.
 * - POST ensures all numeric fields are coerced to numbers, date is optional.
 *
 * Scalability insight:
 * - Could add batch creation or update endpoints for bulk operations.
 */
