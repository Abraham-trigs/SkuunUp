// app/api/decisions/route.ts
// Purpose: Full CRUD + recursive decision chain for DecisionRecords (school-scoped, Next.js 15.5 async params)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";

// -------------------- Schemas --------------------
const createDecisionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  context: z.string(),
  decision: z.string(),
  consequences: z.string(),
  supersedesId: z.string().optional(),
});

const updateDecisionSchema = z.object({
  title: z.string().optional(),
  context: z.string().optional(),
  decision: z.string().optional(),
  consequences: z.string().optional(),
  status: z.enum(["PROPOSED", "ACCEPTED", "IMPLEMENTED", "SUPERSEDED"]).optional(),
  implementedAt: z.string().datetime().optional(),
});

const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["PROPOSED", "ACCEPTED", "IMPLEMENTED", "SUPERSEDED"]).optional(),
});

// -------------------- Recursive Helper --------------------
async function getDecisionChain(
  id: string,
  schoolId: string,
  visited = new Set<string>(),
  depth = 0
): Promise<any | null> {
  if (visited.has(id) || depth > 50) return null;
  visited.add(id);

  const decision = await prisma.decisionRecord.findUnique({
    where: { id },
    include: { supersedes: true, supersededBy: true },
  });

  if (!decision || decision.schoolId !== schoolId) return null;

  const previous = decision.supersedesId
    ? await getDecisionChain(decision.supersedesId, schoolId, visited, depth + 1)
    : null;

  const next: any[] = [];
  for (const succ of decision.supersededBy) {
    const chain = await getDecisionChain(succ.id, schoolId, visited, depth + 1);
    if (chain) next.push(chain);
  }

  return { ...decision, supersedes: previous, supersededBy: next };
}

// -------------------- GET /api/decisions --------------------
export async function GET(req: NextRequest) {
  try {
    const account = await SchoolAccount.init();
    if (!account || !account.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Math.max(Number(query.page ?? 1), 1);
    const perPage = Math.max(Number(query.perPage ?? 10), 1);

    const where: any = { schoolId: account.schoolId };
    if (query.search) where.title = { contains: query.search, mode: "insensitive" };
    if (query.status) where.status = query.status;

    const [total, decisions] = await prisma.$transaction([
      prisma.decisionRecord.count({ where }),
      prisma.decisionRecord.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
        include: { supersedes: true, supersededBy: true },
      }),
    ]);

    return NextResponse.json({ decisions, total, page, perPage });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST /api/decisions --------------------
export async function POST(req: NextRequest) {
  try {
    const account = await SchoolAccount.init();
    if (!account || !account.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createDecisionSchema.parse(body);

    if (data.supersedesId) {
      await prisma.decisionRecord.update({
        where: { id: data.supersedesId },
        data: { status: "SUPERSEDED" },
      });
    }

    const newDecision = await prisma.decisionRecord.create({
      data: {
        ...data,
        // FIXED: Using account.info.id to match the getter in your SchoolAccount file
        authorId: account.info.id, 
        schoolId: account.schoolId,
        status: "PROPOSED",
      },
      include: { supersedes: true, supersededBy: true },
    });

    return NextResponse.json(newDecision, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to create decision" }, { status: 500 });
  }
}

// -------------------- PATCH /api/decisions/:id --------------------
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const account = await SchoolAccount.init();
    if (!account || !account.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const { id } = params;

    const body = await req.json();
    const data = updateDecisionSchema.parse(body);

    const decision = await prisma.decisionRecord.findUnique({ where: { id } });
    if (!decision || decision.schoolId !== account.schoolId)
      return NextResponse.json({ error: "Decision not found or access denied" }, { status: 404 });

    const updated = await prisma.decisionRecord.update({
      where: { id },
      data,
      include: { supersedes: true, supersededBy: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to update decision" }, { status: 500 });
  }
}

// -------------------- DELETE /api/decisions/:id --------------------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const account = await SchoolAccount.init();
    if (!account || !account.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const { id } = params;

    const decision = await prisma.decisionRecord.findUnique({ where: { id } });
    if (!decision || decision.schoolId !== account.schoolId)
      return NextResponse.json({ error: "Decision not found or access denied" }, { status: 404 });

    await prisma.decisionRecord.delete({ where: { id } });
    return NextResponse.json({ message: "Decision deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete decision" }, { status: 500 });
  }
}
