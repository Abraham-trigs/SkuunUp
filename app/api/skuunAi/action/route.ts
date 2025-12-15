// app/api/skuunAi/streamAction/route.ts
// Purpose: Stream AI action outputs live while keeping main session intact.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";
import type { AIActionType } from "@/lib/types/skuunAiTypes.ts";
import { skuunAiActionHandlers } from "@/lib/skuunAiActions.ts";

// -------------------- Zod Schema --------------------
const triggerActionSchema = z.object({
  sessionId: z.string(),
  type: z.nativeEnum(AIActionType),
  payload: z.any().optional(),
});

// -------------------- Streaming Helper --------------------
async function* aiActionStreamGenerator(type: AIActionType, payload: any) {
  // Call your handler which returns chunks or generates content
  const handler = skuunAiActionHandlers[type];
  if (!handler) return;

  // The handler could return an async generator or an array of messages
  const messages = await handler(payload);

  for (const msg of messages) {
    yield JSON.stringify({ chunk: msg }) + "\n";
    await new Promise((r) => setTimeout(r, 50)); // simulate streaming delay
  }
}

// -------------------- POST Streaming Endpoint --------------------
export async function POST(req: NextRequest) {
  try {
    // Auth: Initialize school account
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = triggerActionSchema.parse(body);
    const { sessionId, type, payload = {} } = data;

    // Ensure session exists
    const session = await prisma.skuunAiSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Insert the action in DB as PENDING
    const actionRecord = await prisma.skuunAiAction.create({
      data: { sessionId, type, payload, status: "PENDING" },
    });

    // Stream the AI response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = aiActionStreamGenerator(type, payload);
          for await (const chunk of generator) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // Update action status to EXECUTED
          await prisma.skuunAiAction.update({
            where: { id: actionRecord.id },
            data: { status: "EXECUTED" },
          });

          controller.close();
        } catch (err: any) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
