// app/api/staff/[id]/route.ts
// Purpose: Fetch, update, and delete a single staff member scoped to the authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// -------------------- Zod schema for PUT --------------------
const staffUpdateSchema = z.object({
  position: z.string().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  classId: z.string().uuid().nullable().optional(),
  salary: z.number().nullable().optional(),
});

// -------------------- GET: Retrieve Staff --------------------
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        schoolId: schoolAccount.schoolId,
      },
      include: { user: true, class: true, department: true, subjects: true },
    });

    if (!staff)
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    return NextResponse.json(staff, { status: 200 });
  } catch (err: any) {
    console.error("GET /staff/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- PUT: Update Staff --------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = staffUpdateSchema.parse(body);

    const updated = await prisma.staff.updateMany({
      where: {
        id: params.id,
        schoolId: schoolAccount.schoolId,
      },
      data: parsed,
    });

    if (updated.count === 0)
      return NextResponse.json({ error: "Staff not found or forbidden" }, { status: 404 });

    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: { user: true, class: true, department: true, subjects: true },
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });

    console.error("PUT /staff/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- DELETE: Remove Staff --------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deleted = await prisma.staff.deleteMany({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
    });

    if (deleted.count === 0)
      return NextResponse.json({ error: "Staff not found or forbidden" }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /staff/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- Argument-free SchoolAccount.init() for multi-tenant safety
- GET retrieves staff with full relational data
- PUT validates payload with Zod, ensures atomic update, and prevents unauthorized edits
- DELETE safely removes staff only within the authenticated school

Structure:
- GET → fetch single staff
- PUT → update single staff
- DELETE → remove staff

Implementation guidance:
- Frontend sends PUT payload with optional fields
- Consistent error codes: 401, 404, 400, 500
- Transactions unnecessary for single-row updates but can be added if multi-step relations are updated

Scalability insight:
- Adding new staff fields requires only schema update
- DTO consistent for tables and detail views
- Maintains data integrity and avoids cross-school leaks
*/
