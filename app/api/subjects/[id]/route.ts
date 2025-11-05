// app/api/subjects/[id]/route.ts — Retrieve, update, and delete a single Subject (scoped to authenticated user's school)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

/**

Assumptions:

Prisma Subject model contains: id, name, code, description, schoolId, createdById

Subject has relation createdBy pointing to a User/Staff model with fields { id, name, role }

cookieUser(req) returns { id: string, schoolId: string } or null

Error shape on validation/other failures: { error: string | { field: string[] } }
*/

/* ------------------------- Schemas & Helpers ------------------------- */

const subjectSchema = z.object({
name: z.string().min(1, "Name is required").transform((s) => s.trim()),
code: z.string().min(1, "Code is required").transform((s) => s.trim().toUpperCase()),
description: z.string().optional().nullable().transform((v) => {
if (v === undefined) return null;
// coerce empty string to null
const t = (v as string | null);
return (t ?? "").trim() === "" ? null : (t ?? null);
}),
});

type SubjectInput = z.infer<typeof subjectSchema>;
type UserSession = { id: string; schoolId: string };

/** Normalize incoming payload leniently (coerce numbers-as-strings if any) */
const normalizeInput = (input: any): any => ({
name: typeof input.name === "string" ? input.name.trim() : input.name,
code: typeof input.code === "string" ? input.code.trim().toUpperCase() : input.code,
description:
input.description === undefined || input.description === null
? null
: String(input.description).trim() === ""
? null
: String(input.description).trim(),
});

/** Consistent JSON error responder */
const jsonError = (payload: { error: string | Record<string, string[]> }, status = 400) =>
NextResponse.json(payload, { status });

/* ------------------------- GET ------------------------- */
export async function GET(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
const user = (await cookieUser(req)) as UserSession | null;
if (!user) return jsonError({ error: "Unauthorized" }, 401);

const subjectId = params.id;
if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

// Find subject scoped to user's school and include creator info for UI
const subject = await prisma.subject.findFirst({
  where: { id: subjectId, schoolId: user.schoolId },
  include: { createdBy: { select: { id: true, name: true, role: true } } },
});

if (!subject) return jsonError({ error: "Subject not found" }, 404);

return NextResponse.json(subject);


} catch (err: any) {
console.error("GET /api/subjects/[id] error:", err);
return jsonError({ error: err?.message || "Failed to fetch subject" }, 500);
}
}

/* ------------------------- PUT ------------------------- */
export async function PUT(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
const user = (await cookieUser(req)) as UserSession | null;
if (!user) return jsonError({ error: "Unauthorized" }, 401);

const subjectId = params.id;
if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

const raw = await req.json();
const normalized = normalizeInput(raw);

// Validate with Zod to get field-level errors in consistent shape
const parsed = subjectSchema.safeParse(normalized);
if (!parsed.success) {
  return jsonError({ error: parsed.error.flatten().fieldErrors }, 400);
}
const payload: SubjectInput = parsed.data;

// Use a transaction to atomically check uniqueness and update
const [existingSubject, duplicateCode] = await prisma.$transaction([
  prisma.subject.findFirst({
    where: { id: subjectId, schoolId: user.schoolId },
    select: { id: true },
  }),
  prisma.subject.findFirst({
    where: {
      code: payload.code,
      schoolId: user.schoolId,
      NOT: { id: subjectId },
    },
    select: { id: true },
  }),
]);

if (!existingSubject) return jsonError({ error: "Subject not found" }, 404);
if (duplicateCode) return jsonError({ error: "Subject code already exists" }, 409);

const updated = await prisma.subject.update({
  where: { id: subjectId },
  data: {
    name: payload.name,
    code: payload.code,
    description: payload.description,
  },
  include: { createdBy: { select: { id: true, name: true, role: true } } },
});

return NextResponse.json(updated);


} catch (err: any) {
console.error("PUT /api/subjects/[id] error:", err);
return jsonError({ error: err?.message || "Failed to update subject" }, 500);
}
}

/* ------------------------- DELETE ------------------------- */
export async function DELETE(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
const user = (await cookieUser(req)) as UserSession | null;
if (!user) return jsonError({ error: "Unauthorized" }, 401);

const subjectId = params.id;
if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

// Ensure subject exists and belongs to user's school
const subject = await prisma.subject.findFirst({
  where: { id: subjectId, schoolId: user.schoolId },
  select: { id: true },
});
if (!subject) return jsonError({ error: "Subject not found" }, 404);

// Note: if your schema has relations that must be handled (e.g. ClassSubject links),
// prefer a transaction or soft-delete. Here we perform a single delete.
await prisma.subject.delete({ where: { id: subjectId } });

return NextResponse.json({ success: true });


} catch (err: any) {
console.error("DELETE /api/subjects/[id] error:", err);
// Prisma foreign key errors may surface here if referential integrity prevents delete
return jsonError({ error: err?.message || "Failed to delete subject" }, 500);
}
}

/*
Design reasoning → Return full subject object including a minimal createdBy relation for UI needs. PUT uses Zod for field-level validation and a transaction to prevent race conditions when checking duplicate codes. DELETE is guarded by ownership checks; avoid blind deletes across schools.

Structure → Exports GET, PUT, DELETE. Helpers: normalizeInput, jsonError. Validation with Zod ensures consistent error shapes { error: string | { field: string[] } }. All routes require cookie-based auth and scope operations to schoolId.

Implementation guidance → Ensure Prisma Subject model includes createdById relation and createdBy relation selection. Ensure cookieUser(req) returns { id, schoolId }. If delete must cascade or be soft, replace delete with a transaction that handles dependent records or mark deletedAt timestamp.

Scalability insight → If subject list grows large, move to cursor-based pagination on list route. For bulk updates or deletes, implement batch endpoints and queue long-running cascade work. Centralize common authorization checks (e.g., assertOwnsSubject(user, subjectId)) into a small helper to avoid repetition across endpoints.
Example usage (curl):


GET: curl -H "Cookie: your_session" "/api/subjects/{id}"


PUT: curl -X PUT -H "Content-Type: application/json" -H "Cookie: your_session" -d '{"name":"Algebra","code":"ALG101","description":"Basics"}' "/api/subjects/{id}"


DELETE: curl -X DELETE -H "Cookie: your_session" "/api/subjects/{id}"
*/

