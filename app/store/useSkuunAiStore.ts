"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { z } from "zod";
import {
  AIActionType,
  MessageType,
  Role,
  SkuunAiSession,
  SkuunAiMessage,
  SkuunAiAction,
  SkuunAiRecommendation,
} from "@/lib/types/skuunAiTypes";
import {SkuunAiMessageDTO , SkuunAiRecommendationDTO, } from "@/lib/types/skuunAiClientTypes";

import {
  determineAutoActions,
  triggerAutoActions,
} from "@/lib/skuunAiAutoActions";

import { skuunAiActionHandlers } from "@/lib/skuunAiActions";

// -------------------- Zod Schemas (API Validation) --------------------
const messageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  content: z.string(),
  type: z.nativeEnum(MessageType),
  sender: z.enum(["USER", "AI", "SYSTEM"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const actionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: z.nativeEnum(AIActionType),
  payload: z.any(),
  status: z.enum(["PENDING", "EXECUTED", "FAILED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  executedAt: z.string().optional(),
});

const recommendationSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  category: z.string(),
  message: z.string(),
  data: z.any().optional(),
  targetId: z.string().nullable().optional(),
  resolved: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: z.string(),
  messages: z.array(messageSchema),
  actions: z.array(actionSchema),
  SkuunAiRecommendation: z.array(recommendationSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// -------------------- Helpers --------------------
async function streamSseToStore(
  res: Response,
  sessionId: string,
  aiMessageTemplate: SkuunAiMessageDTO,
  addMessageLocally: (sessionId: string, msg: SkuunAiMessageDTO) => void,
  addRecommendationLocally: (sessionId: string, rec: SkuunAiRecommendationDTO) => void,
  onChunk?: (chunk: SkuunAiMessageDTO) => void,
  onRecommendationChunk?: (rec: SkuunAiRecommendationDTO) => void
) {
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const aiMessage: SkuunAiMessageDTO = { ...aiMessageTemplate, content: "" };
  addMessageLocally(sessionId, aiMessage);

  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      // Recommendation DTO
      try {
        const rec = JSON.parse(line) as SkuunAiRecommendationDTO;
        if (rec?.id && rec?.category) {
          const dto: SkuunAiRecommendationDTO = {
            ...rec,
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt,
          };
          addRecommendationLocally(sessionId, dto);
          onRecommendationChunk?.(dto);
          continue;
        }
      } catch {}

      // Message chunk
      const chunk: SkuunAiMessageDTO = { ...aiMessage, content: line };
      onChunk?.(chunk);

      addMessageLocally(sessionId, {
        ...aiMessage,
        content: aiMessage.content + line,
      });
    }
  }
}


function normalizeSessions(rawSessions: any[]): SkuunAiSession[] {
  return rawSessions.map((s) => ({
    ...s,
    role: s.role as Role, // Prisma enum
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    messages: s.messages.map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    })),
    actions: s.actions.map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
      executedAt: a.executedAt ? new Date(a.executedAt) : undefined,
    })),
    SkuunAiRecommendation: s.SkuunAiRecommendation.map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    })),
  }));
}

// -------------------- Store Type --------------------
interface SkuunAiStore {
  sessions: SkuunAiSession[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;
  activeAbortControllers: Record<string, AbortController>;

  fetchSessions: (page?: number, perPage?: number) => Promise<void>;

  postMessage: (
    content: string,
    type: MessageType,
    sessionId?: string,
    onChunk?: (chunk: string) => void,
    onRecommendationChunk?: (rec: SkuunAiRecommendation) => void
  ) => Promise<void>;

  postAction: (
    type: AIActionType,
    payload: any,
    sessionId: string,
    onChunk?: (chunk: string) => void,
    onRecommendationChunk?: (rec: SkuunAiRecommendation) => void
  ) => Promise<void>;

  cancelStream: (sessionId: string) => void;

  triggerInternalActions: (
    sessionId: string,
    content: string,
    role: Role
  ) => Promise<void>;

  addMessageLocally: (sessionId: string, message: SkuunAiMessage) => void;
  addActionLocally: (sessionId: string, action: SkuunAiAction) => void;
  addRecommendationLocally: (
    sessionId: string,
    recommendation: SkuunAiRecommendation
  ) => void;
}

// -------------------- Store Implementation --------------------
export const useSkuunAiStore = create<SkuunAiStore>()(
  immer((set, get) => ({
    sessions: [],
    total: 0,
    page: 1,
    perPage: 10,
    loading: false,
    error: null,
    activeAbortControllers: {},

    // -------------------- Fetch Sessions --------------------
    fetchSessions: async (page = 1, perPage = 10) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const res = await fetch(`/api/skuunAi?page=${page}&perPage=${perPage}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch sessions");

        const sessions = z.array(sessionSchema).parse(data.sessions);
        const normalized = normalizeSessions(sessions);

        set((state) => {
          state.sessions = normalized;
          state.total = data.total;
          state.page = data.page;
          state.perPage = data.perPage;
          state.loading = false;
        });
      } catch (err: any) {
        set((state) => {
          state.error = err.message;
          state.loading = false;
        });
      }
    },

    // -------------------- Post Message --------------------
   postMessage: async (content, type, sessionId, onChunk, onRecommendationChunk) => {
  const id = sessionId ?? `temp-${Date.now()}`;
  const abortController = new AbortController();
  set((state) => {
    state.activeAbortControllers[id] = abortController;
    state.loading = true;
  });

  const now = new Date().toISOString();
  const tempMessage: SkuunAiMessageDTO = {
    id: crypto.randomUUID(),
    sessionId: id,
    content,
    type,
    sender: "USER",
    createdAt: now,
    updatedAt: now,
  };
  get().addMessageLocally(id, tempMessage);

  try {
    const res = await fetch("/api/skuunAi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type, sessionId: id }),
      signal: abortController.signal,
    });

    if (!res.ok) throw new Error("Failed to post message");

    await streamSseToStore(
      res,
      id,
      { id: crypto.randomUUID(), sessionId: id, content: "", type: MessageType.TEXT, sender: "AI", createdAt: now, updatedAt: now },
      get().addMessageLocally,
      get().addRecommendationLocally,
      onChunk,
      onRecommendationChunk
    );

    await get().triggerInternalActions(id, content, "USER");
  } catch (err: any) {
    if (err.name !== "AbortError") set((state) => { state.error = err.message; });
  } finally {
    set((state) => {
      state.loading = false;
      delete state.activeAbortControllers[id];
    });
  }
},


    // -------------------- Post Action --------------------
   postAction: async (type, payload, sessionId, onChunk, onRecommendationChunk) => {
  const abortController = new AbortController();
  set((state) => {
    state.activeAbortControllers[sessionId] = abortController;
    state.loading = true;
  });

  const now = new Date().toISOString();
  const systemMessage: SkuunAiMessageDTO = {
    id: crypto.randomUUID(),
    sessionId,
    content: `Triggering AI Action: ${type}`,
    type: MessageType.TEXT,
    sender: "SYSTEM",
    createdAt: now,
    updatedAt: now,
  };
  get().addMessageLocally(sessionId, systemMessage);

  try {
    const res = await fetch("/api/skuunAi/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload, sessionId }),
      signal: abortController.signal,
    });

    if (!res.ok) throw new Error("Failed to post action");

    await streamSseToStore(
      res,
      sessionId,
      { id: crypto.randomUUID(), sessionId, content: "", type: MessageType.TEXT, sender: "AI", createdAt: now, updatedAt: now },
      get().addMessageLocally,
      get().addRecommendationLocally,
      onChunk,
      onRecommendationChunk
    );
  } finally {
    set((state) => {
      state.loading = false;
      delete state.activeAbortControllers[sessionId];
    });
  }
},


    cancelStream: (sessionId) => {
      get().activeAbortControllers[sessionId]?.abort();
    },

    triggerInternalActions: async (sessionId, content, role) => {
      const actions = determineAutoActions(content, role);
      if (!actions.length) return;

      await triggerAutoActions(sessionId, actions, { message: content });

      const now = new Date();
      for (const actionType of actions) {
        const handler = skuunAiActionHandlers[actionType];
        if (!handler) continue;

        const recs = await handler({ message: content });
        recs.forEach((rec) =>
          get().addRecommendationLocally(sessionId, {
            ...rec,
            targetId: (rec.data as any)?.studentId ?? null,
            resolved: false,
            createdAt: now,
            updatedAt: now,
          })
        );

        get().addActionLocally(sessionId, {
          id: crypto.randomUUID(),
          sessionId,
          type: actionType,
          payload: { message: content },
          status: "EXECUTED",
          createdAt: now,
          updatedAt: now,
        });
      }
    },

    // -------------------- Local Mutators --------------------
    addMessageLocally: (sessionId, message) => {
      const s = get().sessions.find((s) => s.id === sessionId);
      s?.messages.push(message);
    },

    addActionLocally: (sessionId, action) => {
      const s = get().sessions.find((s) => s.id === sessionId);
      s?.actions.push(action);
    },

    addRecommendationLocally: (sessionId, recommendation) => {
      const s = get().sessions.find((s) => s.id === sessionId);
      s?.SkuunAiRecommendation.push(recommendation);
    },
  }))
);
