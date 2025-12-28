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

    // FIXED: Filter schoolId through the nested user relation
    const where: Prisma.StaffWhereInput = {
      user: {
        schoolId: schoolAccount.schoolId,
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { surname: { contains: search, mode: "insensitive" } },
            { otherNames: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
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

    const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!user || user.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });

    const staff = await prisma.staff.create({
      data: {
        userId: parsed.userId,
        // FIXED: Change 'role' to 'position' to match the Staff model
        position: parsed.position, 
        department: parsed.department ? {
          connect: { id: parsed.department } 
        } : undefined,
        class: parsed.classId ? {
          connect: { id: parsed.classId }
        } : undefined,
        salary: parsed.salary,
        hireDate: parsed.hireDate ? new Date(parsed.hireDate) : undefined,
      },
      include: { user: true, class: true, department: true, subjects: true },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: { message: "Validation failed", details: err.issues } }, { status: 400 });
    }
    console.error("POST /staff error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
