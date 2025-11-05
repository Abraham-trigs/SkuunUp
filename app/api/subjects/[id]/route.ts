// app/api/subjects/[id]/route.ts
// Purpose: Handle single subject retrieval, update, deletion, and include createdBy info

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const subjectUpdateSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subject = await prisma.subject.findUnique({
    where: { id: params.id },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  return NextResponse.json(subject);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = subjectUpdateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const subject = await prisma.subject.update({
    where: { id: params.id },
    data: parsed.data,
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(subject);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.subject.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted successfully" });
}

/*
Design reasoning:
- All GET responses include `createdBy` info for audit transparency.
- Server always sets `createdById` on creation; front-end cannot manipulate it.
- Pagination, search, and validation ensure clean UX and consistent data.

Structure:
- route.ts: GET (list), POST (create)
- [id]/route.ts: GET (single), PUT (update), DELETE (remove)

Implementation guidance:
- Client queries automatically receive `createdBy` (id, name, role) in JSON.
- POST/PUT use server-side logged-in user for `createdById`.

Scalability insight:
- Easy to add `lastModifiedBy` tracking.
- Can enforce role-based edit/delete permissions using createdBy info.
*/
