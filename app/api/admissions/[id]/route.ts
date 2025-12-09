import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

// ------------------ Zod Schemas ------------------
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

const UserSchema = z.object({
  surname: z.string(),
  firstName: z.string(),
  otherNames: z.string().optional(),
  email: z.string().email(),
  password: z.string().optional(), // optional in update
});

const PartialAdmissionSchema = z.object({
  user: UserSchema.optional(),
  classId: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  sex: z.string().optional(),
  languages: z.array(z.string()).optional(),
  mothersTongue: z.string().optional(),
  religion: z.string().optional(),
  denomination: z.string().optional(),
  hometown: z.string().optional(),
  region: z.string().optional(),
  profilePicture: z.string().optional(),
  wardLivesWith: z.string().optional(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  wardMobile: z.string().optional(),
  wardEmail: z.string().email().optional(),
  emergencyContact: z.string().optional(),
  emergencyMedicalContact: z.string().optional(),
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
  feesAcknowledged: z.boolean().optional(),
  declarationSigned: z.boolean().optional(),
  signature: z.string().optional(),
  classification: z.string().optional(),
  submittedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  receivedDate: z.coerce.date().optional(),
  remarks: z.string().optional(),
  status: z.string().optional(),
  progress: z.number().optional(),
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
});

// ------------------ Helpers ------------------
async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

function normalizeForPrisma(data: any) {
  const out = { ...data };
  if (out.previousSchools) out.previousSchools = out.previousSchools.map((ps: any) => ({ ...ps }));
  if (out.familyMembers) out.familyMembers = out.familyMembers.map((fm: any) => ({ ...fm }));
  return out;
}

const StepSchemas = [
  UserSchema,
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
    wardEmail: z.string().email().optional(),
    emergencyContact: z.string().optional(),
    emergencyMedicalContact: z.string().optional(),
  }),
  z.object({
    medicalSummary: z.string().optional(),
    bloodType: z.string().optional(),
    specialDisability: z.string().optional(),
  }),
  z.object({
    previousSchools: z.array(z.any()).optional(),
    familyMembers: z.array(z.any()).optional(),
  }),
  z.object({
    feesAcknowledged: z.boolean().optional(),
    declarationSigned: z.boolean().optional(),
    signature: z.string().optional(),
  }),
];

function calculateDynamicProgress(data: any, schemas: any[]) {
  let completedSteps = 0;
  schemas.forEach((schema) => {
    const fields = Object.keys(schema.shape);
    const stepComplete = fields.every((field) => {
      const value = data[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      return value !== undefined && value !== null && value !== "";
    });
    if (stepComplete) completedSteps += 1;
  });
  return Math.round((completedSteps / schemas.length) * 100);
}

async function replaceNestedArraysTx(tx: any, applicationId: string, payload: { previousSchools?: any[]; familyMembers?: any[] }) {
  const promises: Promise<any>[] = [];
  if (payload.previousSchools) {
    promises.push(tx.previousSchool.deleteMany({ where: { applicationId } }));
    if (payload.previousSchools.length > 0) {
      promises.push(tx.previousSchool.createMany({ data: payload.previousSchools.map((ps) => ({ ...ps, applicationId })) }));
    }
  }
  if (payload.familyMembers) {
    promises.push(tx.familyMember.deleteMany({ where: { applicationId } }));
    if (payload.familyMembers.length > 0) {
      promises.push(tx.familyMember.createMany({ data: payload.familyMembers.map((fm) => ({ ...fm, applicationId })) }));
    }
  }
  await Promise.all(promises);
}

// ------------------ PATCH /[id] ------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const existing = await prisma.application.findUnique({ where: { id: params.id }, include: { student: true, user: true } });

    if (!existing) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    if (existing.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = PartialAdmissionSchema.parse(body);
    const normalized = normalizeForPrisma(parsed);

    const updatedAdmission = await prisma.$transaction(async (tx) => {
      // 1) Update user info if present
      if (normalized.user && existing.student?.userId) {
        await tx.user.update({ where: { id: existing.student.userId }, data: normalized.user });
      }

      // 2) Update student class if changed
      if (normalized.classId && existing.student?.id) {
        await tx.student.update({ where: { id: existing.student.id }, data: { classId: normalized.classId } });
      }

      // 3) Update application
      const updatedApp = await tx.application.update({ where: { id: params.id }, data: normalized });

      // 4) Update nested arrays
      await replaceNestedArraysTx(tx, params.id, { previousSchools: normalized.previousSchools, familyMembers: normalized.familyMembers });

      // 5) Recalculate progress
      const progress = calculateDynamicProgress({ ...updatedApp, previousSchools: normalized.previousSchools, familyMembers: normalized.familyMembers, ...normalized.user }, StepSchemas);
      if (progress !== updatedApp.progress) {
        await tx.application.update({ where: { id: params.id }, data: { progress } });
        updatedApp.progress = progress;
      }

      return updatedApp;
    });

    return NextResponse.json({ success: true, admission: updatedAdmission });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors.map((e) => ({ path: e.path, message: e.message })), status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
