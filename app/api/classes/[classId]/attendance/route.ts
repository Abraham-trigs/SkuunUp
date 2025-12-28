// app/api/classes/[classId]/attendance/route.ts
// Purpose: GET and POST attendance records for a class with multi-tenant safety

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { Role } from "@prisma/client";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// -------------------- Validation --------------------
const attendanceSchema = z.object({
  date: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      timeIn: z.string().optional(),
      timeOut: z.string().optional(),
      remarks: z.string().optional(),
    })
  ),
});

// -------------------- GET Attendance --------------------
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ classId: string }> } // FIXED: Async params for Next.js 15
) {
  try {
    const { classId } = await params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date");
    const date = dateQuery ? new Date(dateQuery) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const attendance = await prisma.studentAttendance.findMany({
      where: {
        student: { 
          classId: classId, 
          // FIXED: Use PascalCase 'Class' relation to match Prisma schema types
          Class: { schoolId: schoolAccount.schoolId } 
        },
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { 
        student: { 
          include: { 
            user: { select: { id: true, firstName: true, surname: true, email: true } } 
          } 
        } 
      },
      orderBy: { student: { user: { surname: "asc", firstName: "asc" } } },
    });

    return NextResponse.json(attendance);
  } catch (err: any) {
    console.error("GET /attendance error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST Attendance --------------------
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ classId: string }> } // FIXED: Async params for Next.js 15
) {
  try {
    const { classId } = await params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // FIXED: Explicitly type the array as Role[] to prevent Role vs String literal assignment errors
    const allowedRoles: Role[] = [Role.ADMIN, Role.TEACHER];
    if (!allowedRoles.includes(schoolAccount.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = attendanceSchema.parse(body);
    const date = data.date ? new Date(data.date) : new Date();
    
    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: schoolAccount.schoolId },
      include: { students: true },
    });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const results = await prisma.$transaction(
      data.records.map((r) =>
        prisma.studentAttendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date: new Date(date.toDateString()) } },
          update: { 
            status: r.status, 
            timeIn: r.timeIn ? new Date(r.timeIn) : null, 
            timeOut: r.timeOut ? new Date(r.timeOut) : null, 
            remarks: r.remarks 
          },
          create: { 
            studentId: r.studentId, 
            date: new Date(date.toDateString()), 
            status: r.status, 
            timeIn: r.timeIn ? new Date(r.timeIn) : null, 
            timeOut: r.timeOut ? new Date(r.timeOut) : null, 
            remarks: r.remarks 
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length }, { status: 201 });
  } catch (err: any) {
    console.error("POST /attendance error:", err);
    // FIXED: Using .issues for Zod compatibility in production builds
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
