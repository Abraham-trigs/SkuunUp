// app/api/admissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

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
  startDate: z.string(),
  endDate: z.string(),
});

const AdmissionSchema = z.object({
  studentId: z.string(),
  classId: z.string(),
  surname: z.string(),
  firstName: z.string(),
  otherNames: z.string().optional(),
  dateOfBirth: z.string(),
  nationality: z.string(),
  sex: z.string(),
  languages: z.array(z.string()),
  mothersTongue: z.string(),
  religion: z.string(),
  denomination: z.string().optional(),
  hometown: z.string(),
  region: z.string(),
  profilePicture: z.string().optional(),
  wardLivesWith: z.string(),
  numberOfSiblings: z.number().optional(),
  siblingsOlder: z.number().optional(),
  siblingsYounger: z.number().optional(),
  postalAddress: z.string(),
  residentialAddress: z.string(),
  wardMobile: z.string().optional(),
  wardEmail: z.string().optional(),
  emergencyContact: z.string(),
  emergencyMedicalContact: z.string().optional(),
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
  feesAcknowledged: z.boolean().default(false),
  declarationSigned: z.boolean().default(false),
  signature: z.string().optional(),
  classification: z.string().optional(),
  submittedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  receivedDate: z.string().optional(),
  remarks: z.string().optional(),
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
  admissionPin: z.string(),
});

// -------------------- GET minimal admission --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const admissionId = searchParams.get("admissionId");
    if (!admissionId) return NextResponse.json({ error: "admissionId is required" }, { status: 400 });

    const admission = await prisma.application.findFirst({
      where: { id: admissionId, schoolId: schoolAccount.schoolId },
      include: { previousSchools: true, familyMembers: true },
    });

    if (!admission) return NextResponse.json({ error: "Admission not found" }, { status: 404 });

    return NextResponse.json({ admission });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST create admission --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = AdmissionSchema.parse(body);

    const selectedClass = await prisma.class.findFirst({
      where: { id: data.classId, schoolId: schoolAccount.schoolId },
    });
    if (!selectedClass) return NextResponse.json({ error: "Invalid class selected" }, { status: 400 });

    const payment = await prisma.admissionPayment.findFirst({
      where: { pinCode: data.admissionPin, used: false, studentId: data.studentId, schoolId: schoolAccount.schoolId },
    });
    if (!payment) return NextResponse.json({ error: "Invalid or used admission PIN" }, { status: 400 });

    const admission = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          studentId: data.studentId,
          schoolId: schoolAccount.schoolId,
          surname: data.surname,
          firstName: data.firstName,
          otherNames: data.otherNames,
          dateOfBirth: new Date(data.dateOfBirth),
          nationality: data.nationality,
          sex: data.sex,
          languages: data.languages,
          grade: selectedClass.name,
          mothersTongue: data.mothersTongue,
          religion: data.religion,
          denomination: data.denomination,
          hometown: data.hometown,
          region: data.region,
          profilePicture: data.profilePicture,
          wardLivesWith: data.wardLivesWith,
          numberOfSiblings: data.numberOfSiblings,
          siblingsOlder: data.siblingsOlder,
          siblingsYounger: data.siblingsYounger,
          postalAddress: data.postalAddress,
          residentialAddress: data.residentialAddress,
          wardMobile: data.wardMobile,
          wardEmail: data.wardEmail,
          emergencyContact: data.emergencyContact,
          emergencyMedicalContact: data.emergencyMedicalContact,
          medicalSummary: data.medicalSummary,
          bloodType: data.bloodType,
          specialDisability: data.specialDisability,
          feesAcknowledged: data.feesAcknowledged,
          declarationSigned: data.declarationSigned,
          signature: data.signature,
          classification: data.classification,
          submittedBy: data.submittedBy,
          receivedBy: data.receivedBy,
          receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
          remarks: data.remarks,
          admissionPaymentId: payment.id,
          previousSchools: { create: data.previousSchools || [] },
          familyMembers: { create: data.familyMembers || [] },
        },
      });

      await tx.student.create({
        data: { id: data.studentId, userId: data.studentId, classId: selectedClass.id, enrolledAt: new Date(), application: { connect: { id: app.id } } },
      });

      await tx.admissionPayment.update({ where: { id: payment.id }, data: { used: true } });

      return app;
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
