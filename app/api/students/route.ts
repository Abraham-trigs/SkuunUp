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

function parsePagination(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const page = Math.max(parseInt(params.page || "1"), 1);
  const perPage = Math.max(parseInt(params.perPage || "20"), 1);
  const sortBy = params.sortBy || "surname";
  const sortOrder: "asc" | "desc" = (params.sortOrder as any) === "desc" ? "desc" : "asc";
  const search = params.search || "";
  const classId = params.classId;
  const gradeId = params.gradeId;
  return { page, perPage, sortBy, sortOrder, search, classId, gradeId };
}

// ------------------ GET / POST /api/students ------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const { page, perPage, sortBy, sortOrder, search, classId, gradeId } = parsePagination(req);

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
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: true,
        Class: true,
        Grade: true,
        application: true, // admissionId mapping
      },
      orderBy: { user: { [sortBy]: sortOrder } },
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
      admissionId: s.application?.id || null,
    }));

    return NextResponse.json({
      students: list,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const body = await req.json();
    const { userId, classId, gradeId } = body;

    if (!userId) throw new Error("userId is required");

    const student = await prisma.student.create({
      data: {
        userId,
        schoolId: schoolAccount.schoolId,
        classId,
        gradeId,
      },
      include: { user: true, Class: true, Grade: true, application: true },
    });

    return NextResponse.json({ student });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 400 });
  }
}
