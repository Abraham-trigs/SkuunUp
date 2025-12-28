// app/api/library/[id]/route.ts
// Purpose: Update or delete a library book, scoped to authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// -------------------- Schemas --------------------
const bookUpdateSchema = z.object({
  title: z.string().optional(),
  isbn: z.string().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  totalCopies: z.preprocess((v) => (v ? Number(v) : undefined), z.number().min(1).optional()),
});

// -------------------- Helpers --------------------
async function assertBookOwnership(bookId: string, schoolId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("Book not found");
  if (book.schoolId !== schoolId) throw new Error("Forbidden");
  return book;
}

// -------------------- PUT /:id --------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = bookUpdateSchema.parse(body);

    const book = await assertBookOwnership(params.id, schoolAccount.schoolId);

    const updated = await prisma.book.update({
      where: { id: params.id },
      data: { ...data, available: data.totalCopies ?? book.available },
      include: { author: true, category: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    const status = err.message === "Forbidden" ? 403 : err.message === "Book not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// -------------------- DELETE /:id --------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const book = await assertBookOwnership(params.id, schoolAccount.schoolId);

    await prisma.book.delete({ where: { id: book.id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : err.message === "Book not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

/*
Design reasoning:
- Books are strictly scoped to the authenticated school
- PUT allows partial updates; totalCopies updates available field
- DELETE safely removes book only if ownership confirmed

Structure:
- PUT → update book
- DELETE → remove book
- Helper assertBookOwnership reduces repeated checks

Implementation guidance:
- Use NextRequest and NextResponse for App Router consistency
- Returns 401/403/404/400/500 consistently
- Includes related author and category for frontend

Scalability insight:
- Can extend book schema for new fields without changing route logic
- Ownership check helper allows reuse across other library routes
- Fully type-safe and production-ready
*/
