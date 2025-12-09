// app/api/admissions/route.ts
// Purpose: REST route handler for Admissions (create, read (single/list), partial update) with school-scoped auth,
// validation, nested relations handling, pagination, search & filters, and transactional safety.
//
// Design reasoning:
// - The front-end performs partial, per-step updates. PATCH accepts any subset of admission fields (including nested arrays)
// and applies them atomically using Prisma transactions — this prevents partially-applied form state from corrupting data.
// - GET acts as both single-resource fetch (when admissionId is provided) and a paginated list (when not). This keeps the API ergonomic
// for the multi-step UI which may call both patterns.
// - POST creates the application and related nested records (previousSchools, familyMembers) in a transaction and validates admission PINs.
// - Responses follow a consistent JSON shape: { success: boolean, admission?: any, admissions?: any[], total?: number, error?: any }
// and error shapes return helpful validation details when Zod fails.
//
// Structure:
// - Exports handlers for GET, POST, PATCH compatible with Next.js route handlers.
// - Internal helpers: authorize, parsePartialAdmission, replaceNestedArraysTx to keep transaction logic clean.
// - Zod schemas mirror the front-end admissionFormSchema with coercions for dates so UI date strings are accepted.
//
// Implementation guidance:
// - Drop this file at app/api/admissions/route.ts. Ensure prisma (from @/lib/db) and SchoolAccount (from @/lib/schoolAccount) exist and work as expected.
// - Frontend should call GET with ?admissionId=<id> to fetch a single admission; call GET with ?page=1&limit=20&search=... for lists.
// - For partial updates, call PATCH with ?admissionId=<id> and a JSON body containing only the changed fields (e.g., { classId: "abc" }).
// - Nested arrays (previousSchools / familyMembers) are replaced atomically when passed in PATCH — the previous rows are removed and the new array created.
// - Ensure your Prisma models allow previousSchools and familyMembers to reference applicationId (used below in deleteMany/create).
//
// Scalability insight:
// - For larger data sets, move list filtering into indexed fields and add cursor-based pagination. Replace delete/create pattern for nested arrays
// with a diff/upsert strategy (using client-provided stable IDs) if retention of nested-record IDs is required (e.g., references from other tables).
//
// ----------------------------- FILE START -----------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

// ------------------ Zod Schemas ------------------
// Smaller, focused schemas for nested arrays so we can re-use for partial parsing.
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
// Accept date strings (e.g., "2024-01-02") or Date objects
startDate: z.coerce.date(),
endDate: z.coerce.date(),
});

// Master admission schema matches the front-end admissionFormSchema intent.
// Use z.coerce.date() where dates are expected so string dates are accepted.
export const AdmissionSchema = z.object({
studentId: z.string(),
userId: z.string().optional(), // userId is optional in some flows
classId: z.string().optional(),
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
previousSchools: z.array(PreviousSchoolSchema).optional(),
familyMembers: z.array(FamilyMemberSchema).optional(),
admissionPin: z.string().optional(),
});

// Partial admission schema used for PATCH parsing
const PartialAdmissionSchema = AdmissionSchema.partial();

// ------------------ Helper functions ------------------

/**

Authorize the request: ensures a SchoolAccount is available and returns it.

Throws an Error if unauthorized. The caller is expected to catch and return 401/403.
*/
async function authorize(req: NextRequest) {
// Example: SchoolAccount.init() should parse headers/cookies to determine the current school & user role.
const schoolAccount = await SchoolAccount.init(req);
if (!schoolAccount) throw new Error("Unauthorized");
return schoolAccount;
}

/**

Replace nested arrays (previousSchools / familyMembers) within a transaction.

Deletes existing nested records for this application, then bulk-creates the provided ones.

Uses applicationId foreign key assumed on nested models.
*/
async function replaceNestedArraysTx(tx: any, applicationId: string, payload: { previousSchools?: any[]; familyMembers?: any[] }) {
const promises: Promise<any>[] = [];

if (payload.previousSchools) {
// Delete previous entries and recreate
promises.push(tx.previousSchool.deleteMany({ where: { applicationId } }));
if (payload.previousSchools.length > 0) {
// Attach applicationId to each record for creation
const createPayloads = payload.previousSchools.map((ps) => ({ ...ps, applicationId }));
promises.push(tx.previousSchool.createMany({ data: createPayloads }));
}
}

if (payload.familyMembers) {
promises.push(tx.familyMember.deleteMany({ where: { applicationId } }));
if (payload.familyMembers.length > 0) {
const createPayloads = payload.familyMembers.map((fm) => ({ ...fm, applicationId }));
promises.push(tx.familyMember.createMany({ data: createPayloads }));
}
}

await Promise.all(promises);
}

/**

Normalize certain incoming values before passing to Prisma (e.g., date -> JS Date, numeric strings -> numbers).

We rely on Zod coercions above; this function focuses on shaping nested objects for Prisma bulk create.
*/
function normalizeForPrisma(data: any) {
const out: any = { ...data };

if (out.previousSchools && Array.isArray(out.previousSchools)) {
out.previousSchools = out.previousSchools.map((ps: any) => ({
name: ps.name,
location: ps.location,
startDate: ps.startDate ? new Date(ps.startDate) : undefined,
endDate: ps.endDate ? new Date(ps.endDate) : undefined,
}));
}

if (out.familyMembers && Array.isArray(out.familyMembers)) {
out.familyMembers = out.familyMembers.map((fm: any) => ({
relation: fm.relation,
name: fm.name,
postalAddress: fm.postalAddress,
residentialAddress: fm.residentialAddress,
phone: fm.phone,
email: fm.email,
occupation: fm.occupation,
workplace: fm.workplace,
religion: fm.religion,
isAlive: typeof fm.isAlive === "boolean" ? fm.isAlive : undefined,
}));
}

// Coerce dates if present
if (out.dateOfBirth) out.dateOfBirth = new Date(out.dateOfBirth);
if (out.receivedDate) out.receivedDate = new Date(out.receivedDate);
if (out.submittedDate) out.submittedDate = new Date(out.submittedDate);

return out;
}

// ------------------ GET (single OR list with pagination & filters) ------------------
export async function GET(req: NextRequest) {
try {
const schoolAccount = await authorize(req);
const { searchParams } = new URL(req.url);

const admissionId = searchParams.get("admissionId");
if (admissionId) {
  // Single admission fetch
  const admission = await prisma.application.findUnique({
    where: { id: admissionId },
    include: {
      previousSchools: true,
      familyMembers: true,
      student: { include: { user: true } },
      admissionPayment: true,
    },
  });

  if (!admission) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
  if (admission.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ success: true, admission });
}

// List with pagination, search and filters
const page = Number(searchParams.get("page") || 1);
const limit = Number(searchParams.get("limit") || 20);
const skip = (page - 1) * limit;

// Base filters scoped to school
const baseFilters: any = { schoolId: schoolAccount.schoolId };

// Optional filters
if (searchParams.get("grade")) baseFilters.grade = searchParams.get("grade");
if (searchParams.get("feesAcknowledged")) baseFilters.feesAcknowledged = searchParams.get("feesAcknowledged") === "true";
if (searchParams.get("classification")) baseFilters.classification = searchParams.get("classification");

const search = searchParams.get("search");
const where = search
  ? {
      AND: [
        baseFilters,
        {
          OR: [
            { surname: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { otherNames: { contains: search, mode: "insensitive" } },
            { wardEmail: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    }
  : baseFilters;

const [total, admissions] = await prisma.$transaction([
  prisma.application.count({ where }),
  prisma.application.findMany({
    where,
    include: {
      student: { include: { user: true } },
      previousSchools: true,
      familyMembers: true,
    },
    orderBy: { submissionDate: "desc" },
    skip,
    take: limit,
  }),
]);

return NextResponse.json({ success: true, admissions, total, page, limit });


} catch (err: any) {
// If authorization failed, map to 401
if (err.message && err.message.toLowerCase().includes("unauthorized")) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
}
}

// ------------------ POST create admission (transactional) ------------------
export async function POST(req: NextRequest) {
try {
const schoolAccount = await authorize(req);
const body = await req.json();

// Validate input against the admission schema (required fields checked here can be adjusted)
// For initial create we expect at least studentId + surname + firstName + classId OR admissionPin as applicable
const parsed = AdmissionSchema.strict().parse({
  ...body,
  // admissionPin may be provided; Zod will accept if optional
});

// Validate class if classId provided
if (parsed.classId) {
  const selectedClass = await prisma.class.findUnique({ where: { id: parsed.classId } });
  if (!selectedClass) return NextResponse.json({ error: "Invalid class selected" }, { status: 400 });
}

// Validate admission PIN if provided
let paymentRecord: any = null;
if (parsed.admissionPin) {
  paymentRecord = await prisma.admissionPayment.findFirst({
    where: { pinCode: parsed.admissionPin, used: false, studentId: parsed.studentId, schoolId: schoolAccount.schoolId },
  });
  if (!paymentRecord) return NextResponse.json({ error: "Invalid or used admission PIN" }, { status: 400 });
}

// Normalize nested arrays for Prisma
const normalized = normalizeForPrisma(parsed);

// Transaction: create application, upsert student and mark payment used, nested create previousSchools and familyMembers
const admission = await prisma.$transaction(async (tx) => {
  const app = await tx.application.create({
    data: {
      studentId: normalized.studentId,
      userId: normalized.userId || undefined,
      schoolId: schoolAccount.schoolId,
      surname: normalized.surname,
      firstName: normalized.firstName,
      otherNames: normalized.otherNames,
      dateOfBirth: normalized.dateOfBirth,
      nationality: normalized.nationality,
      sex: normalized.sex,
      languages: normalized.languages,
      grade: normalized.classId ? (await tx.class.findUnique({ where: { id: normalized.classId } }))?.name : undefined,
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
      admissionPaymentId: paymentRecord?.id ?? undefined,
      // Nested creates if arrays provided
      previousSchools: normalized.previousSchools ? { create: normalized.previousSchools } : undefined,
      familyMembers: normalized.familyMembers ? { create: normalized.familyMembers } : undefined,
    },
  });

  // Upsert student (link to application and assign class)
  await tx.student.upsert({
    where: { id: normalized.studentId },
    update: {
      classId: normalized.classId ?? undefined,
      application: { connect: { id: app.id } },
    },
    create: {
      id: normalized.studentId,
      userId: normalized.userId || undefined,
      classId: normalized.classId ?? undefined,
      enrolledAt: new Date(),
      application: { connect: { id: app.id } },
      schoolId: schoolAccount.schoolId,
    },
  });

  if (paymentRecord) {
    await tx.admissionPayment.update({ where: { id: paymentRecord.id }, data: { used: true } });
  }

  return app;
});

return NextResponse.json({ success: true, admission }, { status: 201 });


} catch (err: any) {
if (err instanceof z.ZodError) {
// Return field-level validation errors
const errors = err.errors.map((e) => ({ path: e.path, message: e.message }));
return NextResponse.json({ error: errors }, { status: 400 });
}
if (err.message && err.message.toLowerCase().includes("unauthorized")) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
}
}

// ------------------ PATCH partial update (accepts any subset of fields) ------------------
export async function PATCH(req: NextRequest) {
try {
const schoolAccount = await authorize(req);
const { searchParams } = new URL(req.url);
const admissionId = searchParams.get("admissionId");
if (!admissionId) return NextResponse.json({ error: "admissionId is required" }, { status: 400 });

// Fetch existing admission to validate ownership and to supply IDs for nested ops
const existing = await prisma.application.findUnique({ where: { id: admissionId } });
if (!existing) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
if (existing.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

const body = await req.json();

// Parse partial input - this will coerce date fields where applicable
const parsed = PartialAdmissionSchema.parse(body);

// Normalize shape for Prisma (dates etc.)
const normalized = normalizeForPrisma(parsed);

// Build top-level update object for Prisma; nested arrays handled separately inside transaction
const updatePayload: any = {};

// Whitelist mapping: fields allowed to update directly on application table
const allowedDirectFields = [
  "surname",
  "firstName",
  "otherNames",
  "dateOfBirth",
  "nationality",
  "sex",
  "languages",
  "mothersTongue",
  "religion",
  "denomination",
  "hometown",
  "region",
  "profilePicture",
  "wardLivesWith",
  "numberOfSiblings",
  "siblingsOlder",
  "siblingsYounger",
  "postalAddress",
  "residentialAddress",
  "wardMobile",
  "wardEmail",
  "emergencyContact",
  "emergencyMedicalContact",
  "medicalSummary",
  "bloodType",
  "specialDisability",
  "feesAcknowledged",
  "declarationSigned",
  "signature",
  "classification",
  "submittedBy",
  "receivedBy",
  "receivedDate",
  "remarks",
  "admissionPaymentId",
  // classId is applied to student as well (below) but can optionally be stored as grade on application if desired
];

for (const key of allowedDirectFields) {
  if (key in normalized) {
    updatePayload[key] = (normalized as any)[key];
  }
}

// If languages (array) present, set directly
if ("languages" in normalized && Array.isArray(normalized.languages)) {
  updatePayload.languages = normalized.languages;
}

// For classId changes we need to update the student record as well
const classIdChange = typeof normalized.classId === "string" ? normalized.classId : undefined;

// For studentId/userId updates we might need to adjust student linkage
const studentIdChange = typeof normalized.studentId === "string" ? normalized.studentId : undefined;
const userIdChange = typeof normalized.userId === "string" ? normalized.userId : undefined;

// Execute a transaction to apply all changes atomically
const admission = await prisma.$transaction(async (tx) => {
  // 1) Update application top-level fields
  const updatedApp = await tx.application.update({
    where: { id: admissionId },
    data: {
      ...updatePayload,
    },
  });

  // 2) Replace nested arrays if provided
  await replaceNestedArraysTx(tx, admissionId, {
    previousSchools: normalized.previousSchools,
    familyMembers: normalized.familyMembers,
  });

  // 3) Update student record if classId or studentId changed
  if (classIdChange || studentIdChange || userIdChange) {
    // If studentId changed we should re-link the application to that student in the DB if that makes sense.
    // Note: application.studentId is a plain column; keep it in sync.
    const newStudentId = studentIdChange ?? existing.studentId;

    // Update application.studentId if provided
    if (studentIdChange) {
      await tx.application.update({ where: { id: admissionId }, data: { studentId: newStudentId } });
    }

    // Upsert or update student to ensure classId is set
    await tx.student.upsert({
      where: { id: newStudentId },
      create: {
        id: newStudentId,
        userId: userIdChange ?? undefined,
        classId: classIdChange ?? undefined,
        enrolledAt: new Date(),
        schoolId: schoolAccount.schoolId,
      },
      update: {
        userId: userIdChange ?? undefined,
        classId: classIdChange ?? undefined,
      },
    });
  }

  return updatedApp;
});

return NextResponse.json({ success: true, admission });


} catch (err: any) {
if (err instanceof z.ZodError) {
const errors = err.errors.map((e) => ({ path: e.path, message: e.message }));
return NextResponse.json({ error: errors }, { status: 400 });
}
if (err.message && err.message.toLowerCase().includes("unauthorized")) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
if (err.message && err.message.toLowerCase().includes("forbidden")) {
return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
}
}

// ------------------ Example usage (client) ------------------
/*
GET single:
GET /api/admissions?admissionId=abc

GET list:
GET /api/admissions?page=1&limit=20&search=jane&feesAcknowledged=true

POST create:
POST /api/admissions
body: {
studentId: "stu_1",
userId: "usr_1",
classId: "class_1",
surname: "Doe",
firstName: "Jane",
dateOfBirth: "2018-05-01",
admissionPin: "PIN123", // optional if your flow requires a pin
previousSchools: [{ name: "...", location: "...", startDate: "2016-01-01", endDate: "2017-12-31" }],
familyMembers: [{ relation: "Mother", name: "Eve", postalAddress: "...", residentialAddress: "..." }]
}

PATCH partial:
PATCH /api/admissions?admissionId=app_1
body: { classId: "class_2" }
OR body: { previousSchools: [ ... ] }
OR body: { familyMembers: [ ... ] }
OR body: { feesAcknowledged: true }

Commit message suggestion when ready:
git add app/api/admissions/route.ts
git commit -m "feat(admissions): support partial per-step PATCH and unified GET list/single + transactional nested updates"

*/
