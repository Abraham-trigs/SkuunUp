// app/api/admissions/route.ts
// Purpose: Handle student admission creation after the user has been created
// Full transactional integrity: Application + PreviousSchools + FamilyMembers + AdmissionPayment

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";

// =====================
// Input validation schemas
// =====================
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
  studentId: z.string(), // must match existing User.id from Step 1
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
  admissionPin: z.string(), // required for payment verification
});

// =====================
// POST: Create Admission
// =====================
export async function POST(req: NextRequest) {
  try {
    const authUser = await cookieUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = AdmissionSchema.parse(body);

    // Verify class exists and belongs to user's school
    const selectedClass = await prisma.class.findFirst({
      where: { id: data.classId, schoolId: authUser.schoolDomain ? authUser.Application?.schoolId : undefined },
    });
    if (!selectedClass) return NextResponse.json({ error: "Invalid class selected" }, { status: 400 });

    // Verify AdmissionPayment pinCode
    const payment = await prisma.admissionPayment.findFirst({
      where: {
        pinCode: data.admissionPin,
        used: false,
        studentId: data.studentId,
        schoolId: authUser.Application?.schoolId || undefined,
      },
    });
    if (!payment) return NextResponse.json({ error: "Invalid or already used admission PIN" }, { status: 400 });

    // Transaction: Application + PreviousSchools + FamilyMembers + mark payment used
    const result = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          studentId: data.studentId,
          schoolId: authUser.Application?.schoolId || payment.schoolId,
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

      // Create Student entry linked to the user and class
      await tx.student.create({
        data: {
          id: data.studentId,
          userId: data.studentId,
          classId: selectedClass.id,
          enrolledAt: new Date(),
          application: { connect: { id: app.id } },
        },
      });

      // Mark admission payment as used
      await tx.admissionPayment.update({
        where: { id: payment.id },
        data: { used: true },
      });

      return app;
    });

    return NextResponse.json({ success: true, application: result }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
