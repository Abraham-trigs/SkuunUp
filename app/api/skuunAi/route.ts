// app/api/skuunAi/route.ts
// Purpose: Centralized SkuunAi API endpoint managing sessions, messages, AI actions, and automatic recommendations.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";
import { AIActionType, Role } from "@/lib/types/skuunAiTypes";
import { determineAutoActions, triggerAutoActions } from "@/lib/skuunAiAutoActions";

// -------------------- Zod Schemas --------------------
const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
  type: z.enum(["TEXT", "JSON", "IMAGE"]),
});

const triggerActionSchema = z.object({
  type: z.nativeEnum(AIActionType),
  payload: z.any(),
});

const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
});

// -------------------- Helper: Generate Recommendations --------------------
async function generateRecommendations(
  sessionId: string,
  actionType: AIActionType,
  payload: any
) {
  const recommendations: {
    category: string;
    message: string;
    data?: any;
    targetId?: string | null;
  }[] = [];

  const normalizedPayload = typeof payload === "object" ? payload : { message: payload };

  switch (actionType) {
    case AIActionType.PREDICT_ATTENDANCE:
      recommendations.push({
        category: "Attendance",
        message: "Student may be at risk of chronic absenteeism. Suggest parental notification.",
        data: normalizedPayload,
        targetId: normalizedPayload.studentId ?? null,
      });
      break;
    case AIActionType.FLAG_SPECIAL_NEEDS:
      recommendations.push({
        category: "Student Support",
        message: "Student flagged with special needs. Assign counselor and adjust learning plan.",
        data: normalizedPayload,
        targetId: normalizedPayload.studentId ?? null,
      });
      break;
    case AIActionType.FINANCIAL_INSIGHTS:
      recommendations.push({
        category: "Finance",
        message: "Outstanding payments detected. Send reminder notifications to parents.",
        data: normalizedPayload,
        targetId: normalizedPayload.studentId ?? null,
      });
      break;
    case AIActionType.CHAT_QA:
      recommendations.push({
        category: "AI Chat",
        message: "AI responded to user query with suggested guidance.",
        data: normalizedPayload,
        targetId: null,
      });
      break;
    default:
      recommendations.push({
        category: "General",
        message: `Action ${actionType} executed. Review insights in dashboard.`,
        data: normalizedPayload,
        targetId: null,
      });
  }

  if (!recommendations.length) return;

  await prisma.skuunAiRecommendation.createMany({
    data: recommendations.map((rec) => ({
      sessionId,
      category: rec.category,
      message: rec.message,
      data: rec.data,
      targetId: rec.targetId,
    })),
    skipDuplicates: true,
  });
}

// -------------------- GET SkuunAi Sessions --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Number(query.page || 1);
    const perPage = Number(query.perPage || 10);

    const total = await prisma.skuunAiSession.count({
      where: { userId: schoolAccount.info.id },
    });

    const sessions = await prisma.skuunAiSession.findMany({
      where: { userId: schoolAccount.info.id },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: { messages: true, actions: true, SkuunAiRecommendation: true },
    });

    // Normalize dates and role
    const normalized = sessions.map((s) => ({
      ...s,
      role: s.role as Role,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messages: s.messages.map((m) => ({ ...m, createdAt: m.createdAt, updatedAt: m.updatedAt })),
      actions: s.actions.map((a) => ({ ...a, createdAt: a.createdAt, updatedAt: a.updatedAt, executedAt: a.executedAt ?? undefined })),
      SkuunAiRecommendation: s.SkuunAiRecommendation.map((r) => ({ ...r, createdAt: r.createdAt, updatedAt: r.updatedAt })),
    }));

    return NextResponse.json({ sessions: normalized, total, page, perPage });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: { message: "Validation failed", details: err.issues } }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST Message or AI Action --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    let sessionId: string;

    if ("content" in body) {
      // User message
      const data = sendMessageSchema.parse(body);

      const session = await prisma.skuunAiSession.create({
        data: {
          userId: schoolAccount.info.id,
          role: schoolAccount.role,
          messages: { create: { content: data.content, type: data.type, sender: "USER" } },
        },
        include: { messages: true, actions: true, SkuunAiRecommendation: true },
      });

      sessionId = session.id;

      const autoActions = determineAutoActions(data.content, schoolAccount.role);
      if (autoActions.length) await triggerAutoActions(sessionId, autoActions, { message: data.content });

      await Promise.all(autoActions.map((actionType) =>
        generateRecommendations(sessionId, actionType, { message: data.content })
      ));
    } else if ("type" in body) {
      // Direct AI action
      const data = triggerActionSchema.parse(body);

      const session = await prisma.skuunAiSession.create({
        data: {
          userId: schoolAccount.info.id,
          role: schoolAccount.role,
          actions: { create: { type: data.type, payload: data.payload } },
        },
        include: { messages: true, actions: true, SkuunAiRecommendation: true },
      });

      sessionId = session.id;

      await generateRecommendations(sessionId, data.type, data.payload);
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updatedSession = await prisma.skuunAiSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { messages: true, actions: true, SkuunAiRecommendation: true },
    });

    // Normalize role and dates for store
    const normalized = {
      ...updatedSession,
      role: updatedSession.role as Role,
      messages: updatedSession.messages.map((m) => ({ ...m, createdAt: m.createdAt, updatedAt: m.updatedAt })),
      actions: updatedSession.actions.map((a) => ({ ...a, createdAt: a.createdAt, updatedAt: a.updatedAt, executedAt: a.executedAt ?? undefined })),
      SkuunAiRecommendation: updatedSession.SkuunAiRecommendation.map((r) => ({ ...r, createdAt: r.createdAt, updatedAt: r.updatedAt })),
    };

    return NextResponse.json(normalized, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: { message: "Validation failed", details: err.issues } }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
