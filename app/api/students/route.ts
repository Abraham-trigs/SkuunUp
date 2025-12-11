// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";

// ------------------ Helpers ------------------
async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

// ------------------ GET: List Students ------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const { search = "", page = "1", perPage = "20", classId, gradeId } = Object.fromEntries(req.nextUrl.searchParams.entries());

    const pageNum = parseInt(page as string) || 1;
    const perPageNum = parseInt(perPage as string) || 20;

    const where: any = { schoolId: schoolAccount.schoolId };
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { surname: { contains: search, mode: "insensitive" } } },
        { user: { otherNames: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (classId) where.classId = classId;
    if (gradeId) where.gradeId = gradeId;

    const total = await prisma.student.count({ where });
    const students = await prisma.student.findMany({
      where,
      skip: (pageNum - 1) * perPageNum,
      take: perPageNum,
      include: {
        user: true,
        Class: true,
        Grade: true,
        application: { include: { previousSchools: true, familyMembers: true } },
      },
      orderBy: { user: { surname: "asc" } },
    });

    const list = students.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: [s.user.firstName, s.user.surname, s.user.otherNames].filter(Boolean).join(" "),
      email: s.user.email,
      classId: s.Class?.id,
      className: s.Class?.name,
      gradeId: s.Grade?.id,
      gradeName: s.Grade?.name,
      admission: s.application ? {
        id: s.application.id,
        progress: s.application.progress,
        feesAcknowledged: s.application.feesAcknowledged,
        declarationSigned: s.application.declarationSigned,
      } : null,
    }));

    return NextResponse.json({
      students: list,
      pagination: {
        page: pageNum,
        perPage: perPageNum,
        total,
        totalPages: Math.ceil(total / perPageNum),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
