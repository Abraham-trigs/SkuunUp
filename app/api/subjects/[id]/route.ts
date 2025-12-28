// app/api/subjects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// ------------------------- Schemas & Helpers -------------------------
const subjectSchema = z.object({
  name: z.string().min(1).transform((s) => s.trim()),
  code: z.string().min(1).transform((s) => s.trim().toUpperCase()),
  description: z.string().optional().nullable().transform((v) => (v?.trim() === "" ? null : v)),
});

const normalizeInput = (input: any) => ({
  name: input.name?.trim(),
  code: input.code?.trim().toUpperCase(),
  description: input.description?.trim() || null,
});

const jsonError = (payload: { error: any }, status = 400) =>
  NextResponse.json(payload, { status });

// ------------------------- GET /[id] -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return jsonError({ error: "Unauthorized" }, 401);

    const subjectId = params.id;
    if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

    const subject = await prisma.subject.findFirst({
      where: { 
        id: subjectId, 
        // FIXED: schoolId is on User (createdBy), not directly on Subject
        createdBy: { schoolId: schoolAccount.schoolId } 
      },
      // FIXED: select surname/firstName to match User model
      include: { createdBy: { select: { id: true, surname: true, firstName: true, role: true } } },
    });

    if (!subject) return jsonError({ error: "Subject not found" }, 404);
    return NextResponse.json(subject);
  } catch (err: any) {
    console.error("GET /api/subjects/[id] error:", err);
    return jsonError({ error: err.message || "Failed to fetch subject" }, 500);
  }
}

// ------------------------- PUT /[id] -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return jsonError({ error: "Unauthorized" }, 401);

    const subjectId = params.id;
    const raw = await req.json();
    const normalized = normalizeInput(raw);
    
    // FIXED: Standardize Zod error response using .issues
    const parsed = subjectSchema.safeParse(normalized);
    if (!parsed.success) return jsonError({ error: parsed.error.issues }, 400);

    const payload = parsed.data;

    const [existingSubject, duplicateCode] = await prisma.$transaction([
      prisma.subject.findFirst({
        where: { 
          id: subjectId, 
          createdBy: { schoolId: schoolAccount.schoolId } 
        },
        select: { id: true },
      }),
      prisma.subject.findFirst({
        where: { 
          code: payload.code, 
          createdBy: { schoolId: schoolAccount.schoolId }, 
          NOT: { id: subjectId } 
        },
        select: { id: true },
      }),
    ]);

    if (!existingSubject) return jsonError({ error: "Subject not found" }, 404);
    if (duplicateCode) return jsonError({ error: "Subject code already exists" }, 409);

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: payload,
      include: { createdBy: { select: { id: true, surname: true, firstName: true, role: true } } },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/subjects/[id] error:", err);
    return jsonError({ error: err.message || "Failed to update subject" }, 500);
  }
}

// ------------------------- DELETE /[id] -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return jsonError({ error: "Unauthorized" }, 401);

    const subjectId = params.id;

    const subject = await prisma.subject.findFirst({
      where: { 
        id: subjectId, 
        createdBy: { schoolId: schoolAccount.schoolId } 
      },
      select: { id: true },
    });
    if (!subject) return jsonError({ error: "Subject not found" }, 404);

    await prisma.subject.delete({ where: { id: subjectId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/subjects/[id] error:", err);
    return jsonError({ error: err.message || "Failed to delete subject" }, 500);
  }
}
