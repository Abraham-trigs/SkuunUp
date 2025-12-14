import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { StepSchemas, updateAdmission } from "@/lib/helpers/admission.ts";

export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init(req);
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const stepIndex = body.step ?? 0;

    if (!StepSchemas[stepIndex])
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });

    const validatedData = StepSchemas[stepIndex].parse(body);

    const admission = await prisma.$transaction(async (tx) => {
      let applicationId: string;

      if (stepIndex === 0) {
        // Step 0: Create user, student, and application
        const user = await tx.user.create({
          data: { ...validatedData, role: "STUDENT", schoolId: schoolAccount.schoolId },
        });

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

        applicationId = app.id;
        return tx.application.findUnique({ where: { id: applicationId } });
      } else {
        // Steps > 0: Update existing application by email
        const app = await tx.application.findFirst({ where: { user: { email: body.email } } });
        if (!app) throw new Error("Application not found");
        applicationId = app.id;

        // Update only the fields for this step
        return updateAdmission(tx, applicationId, stepIndex, validatedData);
      }
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    console.error("POST /admission error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
