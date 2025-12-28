// app/api/library/borrowing/route.ts
// Purpose: List and create library borrowings scoped to the authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { Prisma } from "@prisma/client";

// -------------------- Schemas --------------------
const borrowingSchema = z.object({
  studentId: z.string().min(1),
  bookId: z.string().min(1),
  dueDate: z.preprocess((val) => new Date(val as string), z.date()),
});

// -------------------- Helpers --------------------
function buildStudentNameFilter(search: string) {
  return {
    OR: [
      { student: { user: { firstName: { contains: search, mode: "insensitive" } } } },
      { student: { user: { surname: { contains: search, mode: "insensitive" } } } },
      { student: { user: { otherNames: { contains: search, mode: "insensitive" } } } },
    ],
  };
}

// -------------------- GET / --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId) 
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const perPage = Math.min(Math.max(Number(url.searchParams.get("perPage") || 10), 1), 50);

    // FIXED: Use Prisma.BorrowWhereInput for type safety and scope via student relation
    const where: Prisma.BorrowWhereInput = {
      student: { schoolId: schoolAccount.schoolId }
    };
    if (search) Object.assign(where, buildStudentNameFilter(search));

    const [borrowList, total] = await prisma.$transaction([
      // FIXED: Property renamed from borrowing to borrow to match singular model name
      prisma.borrow.findMany({
        where,
        include: { 
          student: { include: { user: true } }, 
          book: true 
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { borrowedAt: "desc" }, // Matches 'borrowedAt' in your model
      }),
      prisma.borrow.count({ where }),
    ]);

    return NextResponse.json({ borrowList, total, page, perPage });
  } catch (err: any) {
    console.error("GET /library/borrowing error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST / --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount || !schoolAccount.schoolId) 
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = borrowingSchema.parse(body);

    const borrowing = await prisma.$transaction(async (tx) => {
      // 1. Verify student and school ownership
      const student = await tx.student.findUnique({
        where: { id: data.studentId },
        select: { schoolId: true }
      });

      if (!student || student.schoolId !== schoolAccount.schoolId) {
        throw new Error("Student not found or access denied");
      }

      // 2. Check book availability using model's 'available' field
      const book = await tx.book.findUnique({ where: { id: data.bookId } });
      if (!book) throw new Error("Book not found");
      if (book.available <= 0) throw new Error("Book not available");

      // 3. Create the record (Renamed borrowing -> borrow)
      const newBorrow = await tx.borrow.create({
        data: {
          studentId: data.studentId,
          bookId: data.bookId,
          dueAt: data.dueDate, // Matches 'dueAt' in your model
        },
        include: { 
          student: { include: { user: true } }, 
          book: true 
        },
      });

      // 4. Atomic decrement of 'available' count
      await tx.book.update({ 
        where: { id: data.bookId }, 
        data: { available: { decrement: 1 } } 
      });

      return newBorrow;
    });

    return NextResponse.json(borrowing, { status: 201 });
  } catch (err: any) {
    console.error("POST /library/borrowing error:", err);
    // FIXED: Use .issues for Zod v4 compatibility
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });

    const status = err.message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
