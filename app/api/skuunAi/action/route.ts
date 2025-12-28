// app/api/skuunAi/action/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";
// FIXED: Standard import (not 'import type') for runtime enum access
import { AIActionType } from "@/lib/types/skuunAiTypes.ts";
import { skuunAiActionHandlers } from "@/lib/skuunAiActions.ts";

// -------------------- Zod Schema --------------------
const triggerActionSchema = z.object({
  sessionId: z.string(),
  type: z.nativeEnum(AIActionType),
  payload: z.any().optional(),
});

// -------------------- FIXED: Missing Generator Function --------------------
async function* aiActionStreamGenerator(type: AIActionType, payload: any) {
  const handler = skuunAiActionHandlers[type];
  if (!handler) return;

  const messages = await handler(payload);

  for (const msg of messages) {
    yield JSON.stringify({ chunk: msg }) + "\n";
    await new Promise((r) => setTimeout(r, 50)); 
  }
}

// -------------------- POST Endpoint --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = triggerActionSchema.parse(body);
    const { sessionId, type, payload = {} } = data;

    const session = await prisma.skuunAiSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const actionRecord = await prisma.skuunAiAction.create({
      data: { sessionId, type, payload, status: "PENDING" },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = aiActionStreamGenerator(type, payload);
          for await (const chunk of generator) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }

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
    if (err instanceof z.ZodError) {
      // FIXED: Used .issues for 2025 Zod compatibility
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
