// app/api/(dashboard)/summary/route.ts
// Purpose: Provide paginated, filtered summary of exams per school for dashboard

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";
import { Prisma } from "@/generated/prisma"; 

// -------------------- Schemas --------------------
const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  studentId: z.string().optional(),
});

// -------------------- Helper --------------------
function formatStudentName(user?: {
  firstName?: string | null;
  surname?: string | null;
  otherNames?: string | null;
} | null): string {
  if (!user) return "Unknown student";

  return [user.firstName, user.surname, user.otherNames]
    .filter(Boolean)
    .join(" ");
}

// -------------------- GET Dashboard Summary --------------------
export async function GET(req: NextRequest) {
  try {
    // Auth via SchoolAccount (argument-free init)
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and normalize query params
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Math.max(Number(query.page ?? 1), 1);
    const perPage = Math.max(Number(query.perPage ?? 20), 1);
    const skip = (page - 1) * perPage;

    const search = query.search?.trim() || undefined;
    const studentId = query.studentId || undefined;

    // -------------------- Prisma where --------------------
    const where: Prisma.ExamWhereInput = {
      student: {
        Class: {
          schoolId: schoolAccount.schoolId,
        },
      },
      ...(search && {
        subject: {
          name: { contains: search, mode: "insensitive" },
        },
      }),
      ...(studentId && { studentId }),
    };

    // -------------------- Query --------------------
    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        include: {
          student: {
            include: { user: true },
          },
          subject: true,
        },
        skip,
        take: perPage,
        orderBy: { date: "desc" },
      }),
      prisma.exam.count({ where }),
    ]);

    // -------------------- DTO (NULL-SAFE) --------------------
    const data = exams.map((e) => ({
      id: e.id,
      score: e.score,
      maxScore: e.maxScore,
      date: e.date,
      subject: e.subject,
      student: e.student
        ? {
            id: e.student.id,
            name: formatStudentName(e.student.user),
            email: e.student.user?.email ?? null,
          }
        : null,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      perPage,
    });
  } catch (err: any) {
    console.error("Dashboard summary error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

/*
Design reasoning:
- Prisma schema allows Exam.student to be nullable → code must respect it
- DTO explicitly models missing student instead of crashing
- Preserves tenant isolation via SchoolAccount
- TypeScript strict mode remains intact

Structure:
- Auth → validation → scoped query → null-safe DTO
- No unsafe assertions, no silent failures

Implementation guidance:
- Frontend should handle student === null defensively
- Ideal for historical or partially-migrated data

Scalability insight:
- Safe for soft-deletes and legacy records
- Schema can later enforce required relations without refactor
*/
