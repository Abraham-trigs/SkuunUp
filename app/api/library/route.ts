// app/api/library/route.ts
// Purpose: List, search, paginate, and create library books scoped to authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

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
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Math.max(Number(query.page ?? 1), 1);
    const perPage = Math.max(Number(query.perPage ?? 10), 1);
    const skip = (page - 1) * perPage;

    const where: Parameters<typeof prisma.book.findMany>[0]["where"] = {
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
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });

    console.error("GET /api/library error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST create book --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });

    console.error("POST /api/library error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- SchoolAccount.init() argument-free ensures multi-tenant safety
- GET supports pagination, search, and total count in a single $transaction
- POST validates all fields and normalizes numeric input; sets available copies = totalCopies
- Consistent error shapes: 401, 400, 500

Structure:
- GET → fetch books list
- POST → create a new book

Implementation guidance:
- Frontend can query with ?page=&perPage=&search=
- Always returns books with author and category populated
- JSON shape: { data, total, page, perPage }

Scalability insight:
- Filters for category, author, or availability can be added easily
- Multi-tenant safe; production-ready for school library management
- Supports large datasets via pagination and $transaction
*/
