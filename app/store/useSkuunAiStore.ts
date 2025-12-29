"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { z } from "zod";

import {
  AIActionType,
  MessageType,
  Role,
} from "@/lib/types/skuunAiTypes";

import type {
  SkuunAiSessionDTO,
  SkuunAiMessageDTO,
  SkuunAiActionDTO,
  SkuunAiRecommendationDTO,
} from "@/lib/types/skuunAiClientTypes";

import {
  determineAutoActions,
  triggerAutoActions,
} from "@/lib/skuunAiAutoActions";

import { skuunAiActionHandlers } from "@/lib/skuunAiActions";

// -------------------- Zod Validators --------------------
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

// -------------------- Store Type --------------------
interface SkuunAiStore {
  sessions: SkuunAiSessionDTO[];
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
    onRecommendationChunk?: (rec: SkuunAiRecommendationDTO) => void
  ) => Promise<void>;

  postAction: (
    type: AIActionType,
    payload: any,
    sessionId: string,
    onChunk?: (chunk: string) => void,
    onRecommendationChunk?: (rec: SkuunAiRecommendationDTO) => void
  ) => Promise<void>;

  cancelStream: (sessionId: string) => void;

  triggerInternalActions: (
    sessionId: string,
    content: string,
    role: Role
  ) => Promise<void>;

  addMessageLocally: (sessionId: string, message: SkuunAiMessageDTO) => void;
  addActionLocally: (sessionId: string, action: SkuunAiActionDTO) => void;
  addRecommendationLocally: (
    sessionId: string,
    recommendation: SkuunAiRecommendationDTO
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
        const res = await fetch(
          `/api/skuunAi?page=${page}&perPage=${perPage}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch sessions");

        const sessions = z.array(sessionSchema).parse(data.sessions);

        set((state) => {
          state.sessions = sessions;
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

    // -------------------- Post User Message (SSE) --------------------
    postMessage: async (
      content,
      type,
      sessionId,
      onChunk,
      onRecommendationChunk
    ) => {
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
          body: JSON.stringify({ content, type, sessionId }),
          signal: abortController.signal,
        });

        if (!res.ok) throw new Error("Failed to post message");

        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        const aiMessage: SkuunAiMessageDTO = {
          id: crypto.randomUUID(),
          sessionId: id,
          content: "",
          type: MessageType.TEXT,
          sender: "AI",
          createdAt: now,
          updatedAt: now,
        };

        get().addMessageLocally(id, aiMessage);

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

            try {
              const rec = JSON.parse(line) as SkuunAiRecommendationDTO;
              if (rec?.id && rec?.category) {
                get().addRecommendationLocally(id, rec);
                onRecommendationChunk?.(rec);
                continue;
              }
            } catch {}

            onChunk?.(line);
            set((state) => {
              const s = state.sessions.find((s) => s.id === id);
              const m = s?.messages.find((m) => m.id === aiMessage.id);
              if (m) m.content += line;
            });
          }
        }

        await get().triggerInternalActions(id, content, "USER");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          set((state) => {
            state.error = err.message;
          });
        }
      } finally {
        set((state) => {
          state.loading = false;
          delete state.activeAbortControllers[id];
        });
      }
    },

    // -------------------- Post Action (SSE) --------------------
    postAction: async (
      type,
      payload,
      sessionId,
      onChunk,
      onRecommendationChunk
    ) => {
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

        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        const aiMessage: SkuunAiMessageDTO = {
          id: crypto.randomUUID(),
          sessionId,
          content: "",
          type: MessageType.TEXT,
          sender: "AI",
          createdAt: now,
          updatedAt: now,
        };

        get().addMessageLocally(sessionId, aiMessage);

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

            try {
              const rec = JSON.parse(line) as SkuunAiRecommendationDTO;
              if (rec?.id && rec?.category) {
                get().addRecommendationLocally(sessionId, rec);
                onRecommendationChunk?.(rec);
                continue;
              }
            } catch {}

            onChunk?.(line);
            set((state) => {
              const s = state.sessions.find((s) => s.id === sessionId);
              const m = s?.messages.find((m) => m.id === aiMessage.id);
              if (m) m.content += line;
            });
          }
        }
      } finally {
        set((state) => {
          state.loading = false;
          delete state.activeAbortControllers[sessionId];
        });
      }
    },

    // -------------------- Cancel Stream --------------------
    cancelStream: (sessionId) => {
      get().activeAbortControllers[sessionId]?.abort();
    },

    // -------------------- Internal AI Actions --------------------
    triggerInternalActions: async (sessionId, content, role) => {
      const actions = determineAutoActions(content, role);
      if (!actions.length) return;

      await triggerAutoActions(sessionId, actions, { message: content });

      const now = new Date().toISOString();

      for (const actionType of actions) {
        const handler = skuunAiActionHandlers[actionType];
        if (!handler) continue;

        const recs = await handler({ message: content });
        recs.forEach((rec) =>
          get().addRecommendationLocally(sessionId, {
            id: crypto.randomUUID(),
            sessionId,
            category: rec.category,
            message: rec.message,
            data: rec.data,
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
