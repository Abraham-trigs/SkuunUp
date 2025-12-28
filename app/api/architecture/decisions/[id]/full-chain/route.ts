// app/api/architecture/decisions/[id]/full-chain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// -------------------- Types --------------------
interface DecisionGraph {
  id: string;
  title: string;
  context: string;
  supersedes: DecisionGraph | null;
  supersededBy: DecisionGraph[];
  [key: string]: any;
}

// -------------------- Zod Schemas --------------------
const paramsSchema = z.object({
  id: z.string().cuid("Invalid decision ID"), 
});

// -------------------- Recursive helper --------------------
async function getFullDecisionGraph(
  id: string,
  schoolId: string,
  visited = new Set<string>(),
  depth = 0
): Promise<DecisionGraph | null> {
  if (visited.has(id) || depth > 50) return null;
  visited.add(id);

  const decision = await prisma.decisionRecord.findUnique({
    where: { id },
    include: {
      supersededBy: { select: { id: true } }
    },
  });

  // Verify existence and multi-tenant isolation using schoolId
  if (!decision || decision.schoolId !== schoolId) return null;

  const previous = decision.supersedesId
    ? await getFullDecisionGraph(decision.supersedesId, schoolId, visited, depth + 1)
    : null;

  const next: DecisionGraph[] = [];
  for (const succ of decision.supersededBy) {
    const chain = await getFullDecisionGraph(succ.id, schoolId, visited, depth + 1);
    if (chain) next.push(chain);
  }

  return {
    ...decision,
    supersedes: previous,
    supersededBy: next,
  };
}

// -------------------- GET /api/decisions/:id/full-chain --------------------
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // Required for Next.js 15
) {
  try {
    const account = await SchoolAccount.init();
    if (!account || !account.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params for Next.js 15 compatibility
    const params = await context.params;
    const { id } = paramsSchema.parse(params);

    const graph = await getFullDecisionGraph(id, account.schoolId);

    if (!graph) {
      return NextResponse.json(
        { error: "Decision not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ graph });
  } catch (err: any) {
    // FIXED: Use .issues instead of .errors for Zod v4 compatibility
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }

    console.error("GET Decision Graph Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch decision graph" },
      { status: 500 }
    );
  }
}
