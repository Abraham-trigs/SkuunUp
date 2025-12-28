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
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // NEXT 15: params is a Promise
) {
  try {
    const { id } = await params; // Resolve async params
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = bookUpdateSchema.parse(body);

    const book = await assertBookOwnership(id, schoolAccount.schoolId);

    const updated = await prisma.book.update({
      where: { id: id },
      data: { 
        ...data, 
        // If totalCopies is updated, we keep available count in sync
        available: data.totalCopies ?? book.available 
      },
      include: { author: true, category: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    // FIXED: Use .issues for Zod v4 compatibility in production builds
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: { message: "Validation failed", details: err.issues } }, { status: 400 });
    }

    const status = err.message === "Forbidden" ? 403 : err.message === "Book not found" ? 404 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// -------------------- DELETE /:id --------------------
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // NEXT 15: params is a Promise
) {
  try {
    const { id } = await params; // Resolve async params
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const book = await assertBookOwnership(id, schoolAccount.schoolId);

    await prisma.book.delete({ where: { id: book.id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : err.message === "Book not found" ? 404 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}
