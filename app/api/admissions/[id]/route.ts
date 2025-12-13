// app/api/admission/[id]/route.ts
// Purpose: Handle PATCH updates to a single admission application step-by-step
// Store-compatible, test-safe, auth-after-validation

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

/* -------------------------------------------------------------------------- */
/*                               STEP SCHEMAS                                  */
/* -------------------------------------------------------------------------- */

const FamilyMemberSchema = z.object({
  relation: z.string(),
  name: z.string(),
  postalAddress: z.string(),
  residentialAddress: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  religion: z.string().optional(),
  isAlive: z.boolean().optional(),
});

const PreviousSchoolSchema = z.object({
  name: z.string(),
  location: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

/* EXACTLY matches store payloads (flat, no nesting) */
const StepSchemas = [
  z.object({
    surname: z.string().min(1),
    firstName: z.string().min(1),
    otherNames: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(1),
  }),
  z.object({
    dateOfBirth: z.coerce.date().optional(),
    nationality: z.string().optional(),
    sex: z.string().optional(),
  }),
  z.object({
    languages: z.array(z.string()).optional(),
    mothersTongue: z.string().optional(),
    religion: z.string().optional(),
    denomination: z.string().optional(),
    hometown: z.string().optional(),
    region: z.string().optional(),
  }),
  z.object({
    profilePicture: z.string().optional(),
    wardLivesWith: z.string().optional(),
    numberOfSiblings: z.number().optional(),
    siblingsOlder: z.number().optional(),
    siblingsYounger: z.number().optional(),
  }),
  z.object({
    postalAddress: z.string().optional(),
    residentialAddress: z.string().optional(),
    wardMobile: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyMedicalContact: z.string().optional(),
  }),
  z.object({
    medicalSummary: z.string().optional(),
    bloodType: z.string().optional(),
    specialDisability: z.string().optional(),
  }),
  z.object({
    previousSchools: z.array(PreviousSchoolSchema).optional(),
    familyMembers: z.array(FamilyMemberSchema).optional(),
  }),
  z.object({
    feesAcknowledged: z.boolean().optional(),
    declarationSigned: z.boolean().optional(),
    signature: z.string().optional(),
    classId: z.string().optional(),
    gradeId: z.string().optional(),
  }),
];

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                   */
/* -------------------------------------------------------------------------- */

// authorize helper function modified to call SchoolAccount.init() correctly (no args needed)
async function authorize() {
  const account = await SchoolAccount.init();
  if (!account) throw new Error("Unauthorized");
  return account;
}

function calculateProgress(app: any) {
  const steps = [
    ["surname", "firstName", "email", "password"],
    ["dateOfBirth", "nationality", "sex"],
    ["languages", "mothersTongue", "religion", "denomination", "hometown", "region"],
    ["profilePicture", "wardLivesWith", "numberOfSiblings", "siblingsOlder", "siblingsYounger"],
    ["postalAddress", "residentialAddress", "wardMobile", "emergencyContact", "emergencyMedicalContact"],
    ["medicalSummary", "bloodType", "specialDisability"],
    ["previousSchools", "familyMembers"],
    ["feesAcknowledged", "declarationSigned", "signature", "classId", "gradeId"],
  ];

  let done = 0;
  for (const fields of steps) {
    const ok = fields.every((f) => {
      const v = app[f];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "boolean") return v === true;
      return v !== undefined && v !== null && v !== "";
    });
    if (ok) done++;
  }

  return Math.round((done / steps.length) * 100);
}

async function syncNestedArrays(
  tx: any,
  applicationId: string,
  payload: { previousSchools?: any[]; familyMembers?: any[] }
) {
  if (payload.previousSchools) {
    await tx.previousSchool.deleteMany({ where: { applicationId } });
    if (payload.previousSchools.length) {
      await tx.previousSchool.createMany({
        data: payload.previousSchools.map((s) => ({ ...s, applicationId })),
      });
    }
  }
  if (payload.familyMembers) {
    await tx.familyMember.deleteMany({ where: { applicationId } });
    if (payload.familyMembers.length) {
      await tx.familyMember.createMany({
        data: payload.familyMembers.map((f) => ({ ...f, applicationId })),
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                    PATCH                                    */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // FIX 1: Await the params before accessing properties
    const { id: applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing application id" }, { status: 400 });
    }

    // Parse body and step
    const body = await req.json();
    const step = body.step;
    if (typeof step !== "number" || !StepSchemas[step]) {
      return NextResponse.json({ error: "Invalid step index" }, { status: 400 });
    }

    // Validate payload for this step
    const parsed = StepSchemas[step].safeParse(body);
    if (!parsed.success) {
      // FIX 2: Safeguard against 'undefined' errors property using null-coalescing
      const errorDetails = parsed.error.errors ?? []; 

      return NextResponse.json(
        {
          error: errorDetails.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Authorize school account
    const schoolAccount = await authorize(); 
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { previousSchools, familyMembers, ...flat } = parsed.data;

    // Transaction: update flat fields + nested arrays + progress
    const updated = await prisma.$transaction(async (tx) => {
      // Update flat fields
      const app = await tx.application.update({
        where: { id: applicationId },
        data: flat,
      });

      // Sync nested arrays (Step 6)
      await syncNestedArrays(tx, applicationId, { previousSchools, familyMembers });

      // Recalculate progress
      const full = await tx.application.findUnique({
        where: { id: applicationId },
        include: { previousSchools: true, familyMembers: true },
      });

      if (full) {
        await tx.application.update({
          where: { id: applicationId },
          data: { progress: calculateProgress(full) },
        });
      }

      return app;
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (err: any) {
      // Log the specific server error to the console for debugging
      console.error("API Error in PATCH /api/admissions/[id]:", err);
      return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
