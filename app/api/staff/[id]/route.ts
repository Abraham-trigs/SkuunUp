// app/api/staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";

// ------------------------- GET: Retrieve Staff -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findFirst({
    where: { id: params.id, user: { schoolId: authUser.schoolId } },
    include: { user: true, class: true, department: true, subjects: true },
  });

  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  return NextResponse.json(staff);
}

// ------------------------- PUT: Update Staff -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { position, departmentId, classId, salary } = body;

    const updated = await prisma.staff.updateMany({
      where: { id: params.id, user: { schoolId: authUser.schoolId } },
      data: {
        position,
        departmentId: departmentId || null,
        classId: classId || null,
        salary: salary || null,
      },
    });

    if (updated.count === 0)
      return NextResponse.json({ error: "Staff not found or forbidden" }, { status: 404 });

    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: { user: true, class: true, department: true, subjects: true },
    });

    return NextResponse.json(staff);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- DELETE: Remove Staff -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const deleted = await prisma.staff.deleteMany({
      where: { id: params.id, user: { schoolId: authUser.schoolId } },
    });

    if (deleted.count === 0)
      return NextResponse.json({ error: "Staff not found or forbidden" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
