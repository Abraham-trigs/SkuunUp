// app/api/library/route.ts
// Purpose: List, search, paginate, and create library books scoped to authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
// IMPORT Prisma namespace for generated input types
import { Prisma } from "@/generated/prisma"; 

// -------------------- Schemas --------------------
const bookSchema = z.object({
  title: z.string().min(1, "Title required"),
  isbn: z.string().min(10, "ISBN too short"),
  authorId: z.string(),
  categoryId: z.string().optional().nullable(),
  totalCopies: z.preprocess((v) => Number(v), z.number().min(1)),
});

const QuerySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
});

// -------------------- GET list of books --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Math.max(Number(query.page ?? 1), 1);
    const perPage = Math.max(Number(query.perPage ?? 10), 1);
    const skip = (page - 1) * perPage;

    // FIXED: Use Prisma.BookWhereInput to resolve the build-time property access error
    const where: Prisma.BookWhereInput = {
      schoolId: schoolAccount.schoolId,
      ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
    };

    const [books, total] = await prisma.$transaction([
      prisma.book.findMany({
        where,
        include: { author: true, category: true },
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({ data: books, total, page, perPage });
  } catch (err: any) {
    // FIXED: Use .issues for Zod compatibility in 2025 builds
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }

    console.error("GET /api/library error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST create book --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = bookSchema.parse(body);

    const newBook = await prisma.book.create({
      data: {
        ...data,
        available: data.totalCopies,
        schoolId: schoolAccount.schoolId,
      },
      include: { author: true, category: true },
    });

    return NextResponse.json({ data: newBook }, { status: 201 });
  } catch (err: any) {
    // FIXED: Use .issues for Zod compatibility
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }

    console.error("POST /api/library error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
