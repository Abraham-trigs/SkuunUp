// app/api/admissions/route.ts
// Purpose: Handle Step 0 of student admission (create user, student, application)

import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { StepSchemas } from "@/lib/helpers/admission.ts";
import { z } from "zod";

// -------------------- POST Admission --------------------
export async function POST(req: NextRequest) {
  try {
    // Auth: argument-free SchoolAccount pattern
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Normalize step index
    const stepIndex = body.step ?? 0;
    if (stepIndex !== 0)
      return NextResponse.json({ error: "POST is only allowed for Step 0" }, { status: 400 });

    // Validate body with Zod schema for Step 0 using .issues
    let validatedData;
    try {
      validatedData = StepSchemas[0].parse(body);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: err.issues.map(issue => ({ path: issue.path, message: issue.message })) },
          { status: 400 }
        );
      }
      throw err;
    }

    // Type assertion for Prisma UserCreateInput
    const userData: Prisma.UserCreateInput = {
      ...validatedData,
      role: "STUDENT",
      schoolId: schoolAccount.schoolId,
    };

    // Transaction: create user, student, and application
    const admission = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: userData });

      const student = await tx.student.create({
        data: { userId: user.id, schoolId: schoolAccount.schoolId, enrolledAt: new Date() },
      });

      const app = await tx.application.create({
        data: {
          userId: user.id,
          studentId: student.id,
          schoolId: schoolAccount.schoolId,
          status: "DRAFT",
          progress: 0,
        },
      });

      // Return fully hydrated application
      return tx.application.findUnique({ where: { id: app.id } });
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    console.error("POST /admissions error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- Uses argument-free SchoolAccount.init() for auth and school scoping
- Validates Step 0 input using Zod .issues for structured error reporting
- Type-safe Prisma input ensures required fields exist at compile time
- Transaction ensures user, student, and application are created atomically

Structure:
- POST(): main handler
- Step index enforced
- Zod validation for request body
- Prisma $transaction for multi-step writes

Implementation guidance:
- Drop into /app/api/admissions
- Frontend must send step=0 payload
- Returns 201 on success with full application

Scalability insight:
- Can add Step 1+ handling by extending StepSchemas array
- Atomic transaction prevents partial writes
- 401/400/500 handling protects UX and data integrity
*/
