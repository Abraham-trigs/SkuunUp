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
  SenderType,
  ActionStatus,
} from "@/lib/types/skuunAiTypes";
import {
  SkuunAiMessageDTO,
  SkuunAiRecommendationDTO,
} from "@/lib/types/skuunAiClientTypes";
import {
  determineAutoActions,
  triggerAutoActions,
} from "@/lib/skuunAiAutoActions";
import { skuunAiActionHandlers, RecommendationPayload  } from "@/lib/skuunAiActions";

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
  addMessageLocally: (sessionId: string, msg: SkuunAiMessage) => void,
  addRecommendationLocally: (sessionId: string, rec: SkuunAiRecommendation) => void,
  onChunk?: (chunk: SkuunAiMessage) => void,
  onRecommendationChunk?: (rec: SkuunAiRecommendation) => void
) {
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const aiMessage: SkuunAiMessageDTO = { ...aiMessageTemplate, content: "" };

  // Push initial empty AI message
  addMessageLocally(sessionId, {
    ...aiMessage,
    createdAt: new Date(aiMessage.createdAt),
    updatedAt: new Date(aiMessage.updatedAt),
  });

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

      // Try parsing recommendation
      try {
        const recDto = JSON.parse(line) as SkuunAiRecommendationDTO;
          if (recDto?.id && recDto?.category) {
            const rec: SkuunAiRecommendation = {
              id: recDto.id,
              sessionId: recDto.sessionId,
              category: recDto.category,
              message: recDto.message,
              data: recDto.data,
              targetId: recDto.targetId ?? undefined, // <-- convert null to undefined
              resolved: recDto.resolved,
              createdAt: new Date(recDto.createdAt),
              updatedAt: new Date(recDto.updatedAt),
            };
            addRecommendationLocally(sessionId, rec);
            onRecommendationChunk?.(rec);
          }
      } catch {}

      // Message chunk
      const msg: SkuunAiMessage = {
        ...aiMessage,
        content: line,
        createdAt: new Date(aiMessage.createdAt),
        updatedAt: new Date(aiMessage.updatedAt),
      };
      addMessageLocally(sessionId, msg);
      onChunk?.(msg);
    }
  }
}

function normalizeSessions(rawSessions: any[]): SkuunAiSession[] {
  return rawSessions.map((s) => ({
    ...s,
    role: s.role as Role,
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
    onChunk?: (chunk: SkuunAiMessage) => void,
    onRecommendationChunk?: (rec: SkuunAiRecommendation) => void
  ) => Promise<void>;
  postAction: (
    type: AIActionType,
    payload: any,
    sessionId: string,
    onChunk?: (chunk: SkuunAiMessage) => void,
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
  addRecommendationLocally: (sessionId: string, recommendation: SkuunAiRecommendation) => void;
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

      const now = new Date();
      const tempMessage: SkuunAiMessage = {
        id: crypto.randomUUID(),
        sessionId: id,
        content,
        type,
        sender: SenderType.USER,
        createdAt: now,
        updatedAt: now,
      };

      get().addMessageLocally(id, tempMessage);

      try {
        const res = await fetch("/api/skuunAi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...tempMessage,
            createdAt: tempMessage.createdAt.toISOString(),
            updatedAt: tempMessage.updatedAt.toISOString(),
          }),
          signal: abortController.signal,
        });

        if (!res.ok) throw new Error("Failed to post message");

        await streamSseToStore(
          res,
          id,
          {
            id: crypto.randomUUID(),
            sessionId: id,
            content: "",
            type: MessageType.TEXT,
            sender: SenderType.AI,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          get().addMessageLocally,
          get().addRecommendationLocally,
          onChunk,
          onRecommendationChunk
        );

        await get().triggerInternalActions(id, content, "STUDENT");
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

      const now = new Date();
      const systemMessage: SkuunAiMessage = {
        id: crypto.randomUUID(),
        sessionId,
        content: `Triggering AI Action: ${type}`,
        type: MessageType.TEXT,
        sender: SenderType.SYSTEM,
        createdAt: now,
        updatedAt: now,
      };
      get().addMessageLocally(sessionId, systemMessage);

      try {
        const res = await fetch("/api/skuunAi/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            payload,
            sessionId,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          }),
          signal: abortController.signal,
        });

        if (!res.ok) throw new Error("Failed to post action");

        await streamSseToStore(
          res,
          sessionId,
          {
            id: crypto.randomUUID(),
            sessionId,
            content: "",
            type: MessageType.TEXT,
            sender: SenderType.AI,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
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

   triggerInternalActions: async (sessionId: string, content: string, role: Role) => {
  const actions = determineAutoActions(content, role);
  if (!actions.length) return;

  await triggerAutoActions(sessionId, actions, { message: content });

  const now = new Date();

  for (const actionType of actions) {
    const handler = skuunAiActionHandlers[actionType];
    if (!handler) continue;

    // The handler returns RecommendationPayload[], not SkuunAiRecommendationDTO
    const recs: RecommendationPayload[] = await handler({ message: content });

    recs.forEach((rec) => {
      const recommendation: SkuunAiRecommendation = {
        id: crypto.randomUUID(),           // generate new ID
        sessionId,                         // associate with current session
        category: rec.category,            // required
        message: rec.message,              // required
        data: rec.data,                    // optional
        targetId: undefined,               // default undefined
        resolved: false,                   // default false
        createdAt: now,
        updatedAt: now,
      };

      get().addRecommendationLocally(sessionId, recommendation);
    });

    get().addActionLocally(sessionId, {
      id: crypto.randomUUID(),
      sessionId,
      type: actionType,
      payload: { message: content },
      status: ActionStatus.EXECUTED,
      createdAt: now,
      updatedAt: now,
    });
  }
},





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
