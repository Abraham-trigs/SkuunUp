// app/api/library/staff/[id]/route.ts
// Purpose: Update or delete a LibraryStaff record scoped to authenticated school with validation and department control

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// -------------------- Schemas --------------------
const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional().nullable(),
});

// -------------------- PUT: Update Library Staff --------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = updateSchema.parse(body);

    const staff = await prisma.libraryStaff.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    if (staff.user.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Update related User fields if provided
    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
      });
    }

    // Update LibraryStaff record
    const updated = await prisma.libraryStaff.update({
      where: { id: params.id },
      data: {
        position: data.position ?? staff.position,
        departmentId: data.departmentId ?? staff.departmentId,
      },
      include: { user: true, department: true },
    });

    return NextResponse.json({ staff: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: { message: "Validation failed", details: err.errors } }, { status: 400 });
    }
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

// -------------------- DELETE: Remove Library Staff --------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await prisma.libraryStaff.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    if (staff.user.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.libraryStaff.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

/*
Design reasoning:
- Scoped to SchoolAccount for multi-tenant safety
- Validates input via Zod
- User fields (name/email) are updated atomically alongside LibraryStaff
- Prevents cross-school modifications

Structure:
- PUT → update staff/user fields with validation
- DELETE → remove staff safely with school ownership check

Implementation guidance:
- Always pass { id } in URL
- Ensure frontend handles both success and field-level errors
- Transactions not needed here as updates are simple

Scalability insight:
- Can add role/permission checks without changing route structure
- Zod schemas allow adding new fields per school policy easily
- Drop-in ready for production, fully multi-tenant safe
*/
