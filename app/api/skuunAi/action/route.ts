// app/api/skuunAi/action/route.ts
// Purpose: SSE endpoint for executing AI actions and streaming recommendations/messages.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";
import { AIActionType } from "@/lib/types/skuunAiTypes";
import { skuunAiActionHandlers } from "@/lib/skuunAiActions";

// -------------------- Zod Schema --------------------
const triggerActionSchema = z.object({
  sessionId: z.string(),
  type: z.nativeEnum(AIActionType),
  payload: z.any().optional(),
});

// -------------------- SSE Generator --------------------
async function* aiActionStreamGenerator(
  type: AIActionType,
  payload: any,
  sessionId: string
) {
  const handler = skuunAiActionHandlers[type];
  if (!handler) return;

  const results = await handler(payload);

  const now = new Date();

  for (const result of results) {
    // Build recommendation object for SSE
    const rec = {
      id: crypto.randomUUID(),
      sessionId,
      category: result.category || "General",
      message: result.message,
      data: result.data || null,
      targetId: (result.data as any)?.studentId ?? null,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    };

    // Persist recommendation in DB
    await prisma.skuunAiRecommendation.create({
      data: rec,
    });

    yield JSON.stringify(rec) + "\n";

    // Small delay for streaming effect
    await new Promise((r) => setTimeout(r, 50));
  }
}

// -------------------- POST Endpoint --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = triggerActionSchema.parse(body);
    const { sessionId, type, payload = {} } = data;

    const session = await prisma.skuunAiSession.findUnique({
      where: { id: sessionId },
    });
    if (!session)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Create pending action record
    const actionRecord = await prisma.skuunAiAction.create({
      data: { sessionId, type, payload, status: "PENDING" },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = aiActionStreamGenerator(type, payload, sessionId);

          for await (const chunk of generator) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // Update action as executed
          await prisma.skuunAiAction.update({
            where: { id: actionRecord.id },
            data: { status: "EXECUTED", executedAt: new Date() },
          });

          controller.close();
        } catch (err: any) {
          // Mark action as failed
          await prisma.skuunAiAction.update({
            where: { id: actionRecord.id },
            data: { status: "FAILED" },
          });

          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "Validation failed", details: err.issues } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
