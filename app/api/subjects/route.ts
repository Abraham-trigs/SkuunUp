// app/api/subjects/route.ts
// Purpose: List and create subjects scoped to the authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// ------------------------- Schemas -------------------------
const subjectCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").toUpperCase(),
  description: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

// ------------------------- GET: List Subjects -------------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const search = query.search?.trim();

    // FIXED: Filter schoolId via the createdBy (User) relation path
    const where: any = {
      createdBy: { schoolId: schoolAccount.schoolId },
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const [subjects, total] = await prisma.$transaction([
      prisma.subject.findMany({
        where,
        // FIXED: Use surname and firstName to match the User model schema
        include: { 
          createdBy: { 
            select: { id: true, surname: true, firstName: true, role: true } 
          } 
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subject.count({ where }),
    ]);

    return NextResponse.json({ subjects, total, page, limit });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// ------------------------- POST: Create Subject -------------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = subjectCreateSchema.parse(body);

    // Check for duplicate code within the same school
    const existing = await prisma.subject.findFirst({
      where: { 
        code: data.code, 
        createdBy: { schoolId: schoolAccount.schoolId } 
      },
    });

    if (existing) return NextResponse.json({ error: "Subject code already exists" }, { status: 409 });

    const subject = await prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        createdById: schoolAccount.info.id,
      },
      // FIXED: Consistently use surname/firstName for User selection
      include: { 
        createdBy: { 
          select: { id: true, surname: true, firstName: true, role: true } 
        } 
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      // FIXED: Standardized Zod error handling for 2025 Next.js build
      return NextResponse.json({ error: { message: "Validation failed", details: err.issues } }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
