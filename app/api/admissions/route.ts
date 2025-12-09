import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z, ZodObject } from "zod";
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
  password: z.string(),
});

const PartialAdmissionSchema = z.object({
  user: UserSchema,
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

// Dynamic progress calculation
const StepSchemas: ZodObject<any>[] = [
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

function calculateDynamicProgress(data: any, schemas: ZodObject<any>[]) {
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

// ------------------ POST create ------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const body = await req.json();
    const parsed = PartialAdmissionSchema.parse(body);
    const normalized = normalizeForPrisma(parsed);

    const admission = await prisma.$transaction(async (tx) => {
      // 1) Create user
      const user = await tx.user.create({
        data: {
          surname: normalized.user.surname,
          firstName: normalized.user.firstName,
          otherNames: normalized.user.otherNames,
          email: normalized.user.email,
          password: normalized.user.password,
          role: "STUDENT",
          schoolId: schoolAccount.schoolId,
        },
      });

      // 2) Create student
      const student = await tx.student.create({
        data: { userId: user.id, schoolId: schoolAccount.schoolId, enrolledAt: new Date(), classId: normalized.classId },
      });

      // 3) Create application
      const appData = {
        studentId: student.id,
        userId: user.id,
        schoolId: schoolAccount.schoolId,
        classId: normalized.classId,
        dateOfBirth: normalized.dateOfBirth,
        nationality: normalized.nationality,
        sex: normalized.sex,
        languages: normalized.languages,
        mothersTongue: normalized.mothersTongue,
        religion: normalized.religion,
        denomination: normalized.denomination,
        hometown: normalized.hometown,
        region: normalized.region,
        profilePicture: normalized.profilePicture,
        wardLivesWith: normalized.wardLivesWith,
        numberOfSiblings: normalized.numberOfSiblings,
        siblingsOlder: normalized.siblingsOlder,
        siblingsYounger: normalized.siblingsYounger,
        postalAddress: normalized.postalAddress,
        residentialAddress: normalized.residentialAddress,
        wardMobile: normalized.wardMobile,
        wardEmail: normalized.wardEmail,
        emergencyContact: normalized.emergencyContact,
        emergencyMedicalContact: normalized.emergencyMedicalContact,
        medicalSummary: normalized.medicalSummary,
        bloodType: normalized.bloodType,
        specialDisability: normalized.specialDisability,
        feesAcknowledged: normalized.feesAcknowledged ?? false,
        declarationSigned: normalized.declarationSigned ?? false,
        signature: normalized.signature,
        classification: normalized.classification,
        submittedBy: normalized.submittedBy,
        receivedBy: normalized.receivedBy,
        receivedDate: normalized.receivedDate,
        remarks: normalized.remarks,
        status: normalized.status ?? "DRAFT",
        progress: 0,
      };

      // calculate dynamic progress
      appData.progress = calculateDynamicProgress({ ...appData, previousSchools: normalized.previousSchools, familyMembers: normalized.familyMembers }, StepSchemas);

      const app = await tx.application.create({
        data: {
          ...appData,
          previousSchools: normalized.previousSchools ? { create: normalized.previousSchools } : undefined,
          familyMembers: normalized.familyMembers ? { create: normalized.familyMembers } : undefined,
        },
      });

      return app;
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors.map((e) => ({ path: e.path, message: e.message })), status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
