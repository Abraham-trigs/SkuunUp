// app/api/(dashboard)/charts/route.ts
// Purpose: Provides class student counts and recent attendance trends (school-scoped)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// -------------------- Helpers --------------------

// Format Date to YYYY-MM-DD (UTC-safe for charting)
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// -------------------- GET Dashboard Charts --------------------
export async function GET() {
  try {
    // Auth & school scoping
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -------------------- Classes + student counts --------------------
    const classes = await prisma.class.findMany({
      where: { schoolId: schoolAccount.schoolId },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
    });

    const classIds = classes.map((c) => c.id);

    // Short-circuit if school has no classes
    if (classIds.length === 0) {
      return NextResponse.json({
        studentsPerClass: [],
        attendanceTrend: [],
      });
    }

    // -------------------- Attendance trend (last 30 days) --------------------
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    /**
     * IMPORTANT:
     * Prisma groupBy does NOT allow relation traversal.
     * We scope by school using classId IN (…) instead.
     */
    const attendances = await prisma.studentAttendance.groupBy({
      by: ["classId", "date"],
      where: {
        classId: { in: classIds },
        date: { gte: thirtyDaysAgo },
        status: "PRESENT",
      },
      _count: { id: true },
    });

    // -------------------- Build lookup map --------------------
    const attendanceMap: Record<string, Record<string, number>> = {};

    for (const row of attendances) {
      const classId = row.classId;
      const dateKey = formatDate(row.date);

      if (!attendanceMap[classId]) {
        attendanceMap[classId] = {};
      }

      attendanceMap[classId][dateKey] = row._count.id;
    }

    // -------------------- Zero-filled trend per class --------------------
    const attendanceTrend = classes.map((cls) => {
      const data = Array.from({ length: 30 }).map((_, i) => {
        const date = new Date(thirtyDaysAgo);
        date.setDate(thirtyDaysAgo.getDate() + i);
        const dateKey = formatDate(date);

        return {
          date: dateKey,
          presentCount: attendanceMap[cls.id]?.[dateKey] ?? 0,
        };
      });

      return {
        className: cls.name,
        data,
      };
    });

    // -------------------- Response --------------------
    return NextResponse.json({
      studentsPerClass: classes.map((c) => ({
        className: c.name,
        count: c._count.students,
      })),
      attendanceTrend,
    });
  } catch (err: any) {
    console.error("Charts API error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

/*
Design reasoning:
- Prisma groupBy forbids relation traversal; classId scoping preserves correctness
- SchoolAccount enforces tenant isolation at the boundary
- Zero-filled attendance trends simplify frontend chart rendering

Structure:
- GET(): single dashboard aggregation endpoint
- Stepwise data resolution: classes → IDs → grouped attendance → mapped trends
- Explicit short-circuit for empty schools

Implementation guidance:
- Drop-in replacement for /app/api/(dashboard)/charts
- Frontend consumes studentsPerClass for summary cards
- attendanceTrend is chart-ready with stable date keys

Scalability insight:
- Scales linearly with number of classes, not students
- Easy to add date-range or classId filters with Zod
- Can be cached or backed by pre-aggregated tables if traffic grows
*/
