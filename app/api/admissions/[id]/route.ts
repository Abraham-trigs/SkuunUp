// app/api/admissions/route/[id]/route.ts
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
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const AdmissionUpdateSchema = z.object({
  // Full optional for multi-step updates
  surname: z.string().optional(),
  firstName: z.string().optional(),
  otherNames: z.string().optional(),
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
  wardEmail: z.string().optional(),
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
  previousSchools: z.array(PreviousSchoolSchema).optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
});

async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const { id } = params;

    const admission = await prisma.application.findUnique({
      where: { id },
      include: { student: { include: { user: true } }, previousSchools: true, familyMembers: true, admissionPayment: true },
    });

    if (!admission || admission.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: admission });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const { id } = params;
    const body = await req.json();
    const data = AdmissionUpdateSchema.parse(body);

    const admission = await prisma.application.findUnique({ where: { id } });
    if (!admission || admission.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });

    const updatedAdmission = await prisma.$transaction(async (tx) => {
      if (data.previousSchools) {
        await tx.previousSchools.deleteMany({ where: { applicationId: id } });
        await tx.previousSchools.createMany({ data: data.previousSchools.map(s => ({ ...s, applicationId: id })) });
      }
      if (data.familyMembers) {
        await tx.familyMembers.deleteMany({ where: { applicationId: id } });
        await tx.familyMembers.createMany({ data: data.familyMembers.map(f => ({ ...f, applicationId: id })) });
      }

      const { previousSchools, familyMembers, ...appFields } = data;
      return tx.application.update({ where: { id }, data: appFields });
    });

    return NextResponse.json({ success: true, data: updatedAdmission });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    const { id } = params;

    const admission = await prisma.application.findUnique({ where: { id } });
    if (!admission || admission.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });

    await prisma.application.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Admission deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
