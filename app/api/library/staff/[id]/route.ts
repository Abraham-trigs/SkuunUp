// app/api/library/staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional().nullable(),
});

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

    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
      });
    }

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
      // Changed .errors to .issues to fix the type error
      return NextResponse.json({ 
        error: { message: "Validation failed", details: err.issues } 
      }, { status: 400 });
    }
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

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
