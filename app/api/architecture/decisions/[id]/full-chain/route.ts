// app/api/decisions/[id]/full-chain/route.ts
// Purpose: Fetch the full decision chain recursively for a given decision ID

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// -------------------- Types --------------------
interface DecisionGraph {
  id: string;
  title: string;
  content?: string | null;
  supersedes: DecisionGraph | null;
  supersededBy: DecisionGraph[];
  [key: string]: any; // preserve additional Prisma fields
}

// -------------------- Recursive helper --------------------
async function getFullDecisionGraph(
  id: string,
  tenantId: string,
  visited = new Set<string>(),
  depth = 0
): Promise<DecisionGraph | null> {
  if (visited.has(id) || depth > 50) return null; // prevent cycles and excessive recursion
  visited.add(id);

  const decision = await prisma.decisionRecord.findUnique({
    where: { id },
    include: { supersedes: true, supersededBy: true },
  });

  if (!decision || decision.tenantId !== tenantId) return null;

  const previous = decision.supersedesId
    ? await getFullDecisionGraph(decision.supersedesId, tenantId, visited, depth + 1)
    : null;

  const next: DecisionGraph[] = [];
  for (const succ of decision.supersededBy) {
    const chain = await getFullDecisionGraph(succ.id, tenantId, visited, depth + 1);
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
  { params }: { params: { id: string } }
) {
  try {
    const account = await SchoolAccount.init();
    if (!account)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;

    const graph = await getFullDecisionGraph(id, account.tenantId);

    if (!graph)
      return NextResponse.json(
        { error: "Decision not found or access denied" },
        { status: 404 }
      );

    return NextResponse.json({ graph });
  } catch (err: any) {
    console.error("GET /decisions/:id/full-chain error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch decision graph" },
      { status: 500 }
    );
  }
}

/*
Design reasoning:
- Recursively fetches decision chain (supersedes and supersededBy)
- SchoolAccount ensures multi-tenant access
- Recursion depth and cycle detection prevent infinite loops

Structure:
- GET() → main handler
- getFullDecisionGraph() → recursive helper for full chain
- Typed interface ensures consistent return shape

Implementation guidance:
- Drop into /api/decisions/[id]/full-chain
- Frontend fetches with authenticated tenant context
- Safe for large chains with depth limit

Scalability insight:
- Can extend to include filters, partial graph fetching, or caching
- Multi-tenant safety and cycle detection ensure secure, stable recursion
*/
