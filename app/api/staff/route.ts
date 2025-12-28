// app/api/staff/route.ts
// Purpose: List and create staff scoped to the authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// -------------------- Zod schemas --------------------
const staffCreateSchema = z.object({
  userId: z.string().uuid(),
  position: z.string(),
  department: z.string().optional(),
  classId: z.string().optional(),
  salary: z.number().optional(),
  hireDate: z.string().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  perPage: z.string().optional(),
});

// -------------------- Helper --------------------
function formatStaffSearch(search?: string): string | undefined {
  const trimmed = search?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

// -------------------- GET: List Staff --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const search = formatStaffSearch(query.search);
    const page = Math.max(Number(query.page ?? 1), 1);
    const perPage = Math.max(Number(query.perPage ?? 10), 1);
    const skip = (page - 1) * perPage;

    const where: Prisma.StaffWhereInput = {
      schoolId: schoolAccount.schoolId,
      user: search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { surname: { contains: search, mode: "insensitive" } },
              { otherNames: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    };

    const [total, staffList] = await prisma.$transaction([
      prisma.staff.count({ where }),
      prisma.staff.findMany({
        where,
        skip,
        take: perPage,
        include: { user: true, class: true, department: true, subjects: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ staffList, total, page, perPage });
  } catch (err: any) {
    console.error("GET /staff error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST: Create Staff --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = staffCreateSchema.parse(body);

    // Ensure user exists and belongs to the same school
    const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!user || user.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });

    const staff = await prisma.staff.create({
      data: {
        userId: parsed.userId,
        role: parsed.position,
        department: parsed.department,
        classId: parsed.classId,
        salary: parsed.salary,
        hireDate: parsed.hireDate ? new Date(parsed.hireDate) : undefined,
        schoolId: schoolAccount.schoolId,
      },
      include: { user: true, class: true, department: true, subjects: true },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });

    console.error("POST /staff error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- Auth is argument-free via SchoolAccount.init() for multi-tenant safety
- GET supports search across firstName, surname, otherNames
- POST validates user exists and belongs to the same school
- Pagination and DTO structure consistent for frontend

Structure:
- GET → list staff with filters, pagination
- POST → create staff atomically

Implementation guidance:
- Drop into /app/api/staff
- Frontend can query with ?search=&page=&perPage=
- Returns 401, 400, 500 consistently

Scalability insight:
- Can extend filters (department, classId) easily
- Transactional safety allows multiple staff creations safely
- DTO ready for frontend tables, optimized for large datasets
*/
