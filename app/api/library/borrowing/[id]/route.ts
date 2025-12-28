// app/api/library/borrowing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// -------------------- Schemas --------------------
const updateSchema = z.object({ isReturning: z.boolean().optional() });

// -------------------- Helpers --------------------
async function assertBorrowingOwnership(borrowingId: string, schoolId: string) {
  const borrowing = await prisma.borrow.findUnique({ 
    where: { id: borrowingId }, 
    include: { 
      book: true,
      student: { select: { schoolId: true } } 
    } 
  });
  
  if (!borrowing) throw new Error("Borrowing not found");
  if (borrowing.student.schoolId !== schoolId) throw new Error("Forbidden");
  
  return borrowing;
}

// -------------------- PUT /:id --------------------
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const borrowing = await assertBorrowingOwnership(id, schoolAccount.schoolId);

      const updatedBorrow = await tx.borrow.update({
        where: { id },
        data: {
          returnedAt: data.isReturning ? new Date() : borrowing.returnedAt,
        },
        include: { 
          student: { include: { user: true } }, 
          book: true 
        },
      });

      // Logic: If it wasn't returned before, but is being returned now, increment available copies
      if (data.isReturning && !borrowing.returnedAt) {
        await tx.book.update({ 
          where: { id: borrowing.bookId }, 
          data: { 
            // FIXED: Using 'available' to match your Book model and 'increment' for type-safety
            available: { increment: 1 } 
          } 
        });
      }

      return updatedBorrow;
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });

    const status = err.message === "Forbidden" ? 403 : err.message === "Borrowing not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// -------------------- DELETE /:id --------------------
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.$transaction(async (tx) => {
      const borrowing = await assertBorrowingOwnership(id, schoolAccount.schoolId);

      await tx.borrow.delete({ where: { id } });
      
      // If book wasn't returned yet, restore 'available' count upon record deletion
      if (!borrowing.returnedAt) {
        await tx.book.update({ 
          where: { id: borrowing.bookId }, 
          data: { 
            // FIXED: Using 'available' and atomic 'increment'
            available: { increment: 1 } 
          } 
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : err.message === "Borrowing not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
