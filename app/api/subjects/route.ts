// app/api/subjects/route.ts
// Purpose: Handle listing and creating subjects with search, pagination, auth, and createdBy info

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const limit = Number(url.searchParams.get("limit") || 20);
  const skip = (page - 1) * limit;

  const subjects = await prisma.subject.findMany({
    where: { name: { contains: search, mode: "insensitive" } },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  const total = await prisma.subject.count({
    where: { name: { contains: search, mode: "insensitive" } },
  });

  return NextResponse.json({ data: subjects, meta: { total, page, limit } });
}

export async function POST(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = subjectSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Server-side assignment of createdById
  const subject = await prisma.subject.create({
    data: {
      ...parsed.data,
      createdById: user.id,
    },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(subject, { status: 201 });
}
