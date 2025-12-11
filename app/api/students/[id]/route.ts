// app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";

// ------------------ Helpers ------------------
async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

// ------------------ GET: Single Student ------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const { id } = params;

    const student = await prisma.student.findFirst({
      where: { id, schoolId: schoolAccount.schoolId },
      include: {
        user: true,
        Class: true,
        Grade: true,
        application: { include: { previousSchools: true, familyMembers: true } },
      },
    });

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const profile = {
      id: student.id,
      userId: student.userId,
      name: [student.user.firstName, student.user.surname, student.user.otherNames].filter(Boolean).join(" "),
      email: student.user.email,
      classId: student.Class?.id,
      className: student.Class?.name,
      gradeId: student.Grade?.id,
      gradeName: student.Grade?.name,
      admission: student.application || null,
    };

    return NextResponse.json({ student: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
