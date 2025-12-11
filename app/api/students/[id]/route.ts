// app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";

async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        Class: true,
        Grade: true,
        application: true, // admissionId
        StudentAttendance: true,
        Exam: true,
        Parent: true,
        Borrow: true,
        Transaction: true,
        Purchase: true,
      },
    });

    if (!student || student.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const response = {
      id: student.id,
      userId: student.userId,
      name: [student.user.firstName, student.user.surname, student.user.otherNames].filter(Boolean).join(" "),
      email: student.user.email,
      classId: student.Class?.id,
      className: student.Class?.name,
      gradeId: student.Grade?.id,
      gradeName: student.Grade?.name,
      admissionId: student.application?.id || null,
      attendance: student.StudentAttendance,
      exams: student.Exam,
      parents: student.Parent,
      borrows: student.Borrow,
      transactions: student.Transaction,
      purchases: student.Purchase,
    };

    return NextResponse.json({ student: response });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const body = await req.json();

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        classId: body.classId,
        gradeId: body.gradeId,
      },
      include: { user: true, Class: true, Grade: true, application: true },
    });

    return NextResponse.json({ student });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    await prisma.student.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Delete failed" }, { status: 400 });
  }
}
