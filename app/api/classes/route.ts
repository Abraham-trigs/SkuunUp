import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// =====================
// Validation Schemas
// =====================
const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  grade: z.string().min(1, "Grade is required"),
});

const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  grade: z.string().optional(),
  staffId: z.string().optional(),
  subjectId: z.string().optional(),
  examId: z.string().optional(),
  studentId: z.string().optional(),
});

// =====================
// GET Classes
// =====================
export async function GET(req: Request) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Number(query.page || "1");
    const perPage = Number(query.perPage || "10");

    const where: any = { schoolId: schoolAccount.schoolId };

    if (query.search) where.name = { contains: query.search, mode: "insensitive" };
    if (query.grade) where.grade = query.grade;
    if (query.staffId) where.staff = { some: { id: query.staffId } };
    if (query.subjectId) where.subjects = { some: { id: query.subjectId } };
    if (query.examId) where.exams = { some: { id: query.examId } };
    if (query.studentId) where.students = { some: { id: query.studentId } };

    const total = await prisma.class.count({ where });

    const classes = await prisma.class.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { name: "asc" },
      include: {
        staff: {
          select: {
            id: true,
            position: true,
            hireDate: true,
            user: {
              select: {
                id: true,
                firstName: true,
                surname: true,
                otherNames: true,
                email: true,
              },
            },
          },
        },
        subjects: { select: { id: true, name: true } },
        exams: { select: { id: true, title: true } },
        students: {
          select: {
            id: true,
            userId: true,
            enrolledAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                surname: true,
                otherNames: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Add fullName fields for convenience
    const classesWithFullName = classes.map((cls) => ({
      ...cls,
      staff: cls.staff.map((st) => ({
        ...st,
        user: {
          ...st.user,
          fullName: [st.user.firstName, st.user.surname, st.user.otherNames].filter(Boolean).join(" "),
        },
      })),
      students: cls.students.map((s) => ({
        ...s,
        user: {
          ...s.user,
          fullName: [s.user.firstName, s.user.surname, s.user.otherNames].filter(Boolean).join(" "),
        },
      })),
    }));

    return NextResponse.json({ classes: classesWithFullName, total, page, perPage });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// =====================
// POST Create Class
// =====================
export async function POST(req: Request) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = classSchema.parse(body);

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        grade: data.grade,
        schoolId: schoolAccount.schoolId,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create class" }, { status: 500 });
  }
}
