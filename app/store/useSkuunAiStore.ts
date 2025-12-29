// app/store/useSkuunAiStore.ts
// Purpose: Fully typed Zustand store for SkuunAi sessions, messages, actions, and recommendations
// Features: streaming, optimistic updates, abort handling, internal AI actions, Zod validation

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { z } from "zod";
import type {
  AIActionType,
  SkuunAiMessage,
  SkuunAiSession,
  SkuunAiAction,
  SkuunAiRecommendation,
  MessageType,
  Role,
} from "@/lib/types/skuunAiTypes.ts";
import { determineAutoActions, triggerAutoActions } from "@/lib/skuunAiAutoActions.ts";
import { skuunAiActionHandlers } from "@/lib/skuunAiActions.ts";

// -------------------- Zod Validators --------------------
const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.nativeEnum(MessageType),
  sender: z.enum(["USER", "AI", "SYSTEM"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const actionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(AIActionType),
  payload: z.any(),
  status: z.enum(["PENDING", "EXECUTED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const recommendationSchema = z.object({
  id: z.string(),
  category: z.string(),
  message: z.string(),
  data: z.any().optional(),
  targetId: z.string().nullable().optional(),
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
  triggerInternalActions: (sessionId: string, content: string, role: Role) => Promise<void>;

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
      set((state) => { state.loading = true; state.error = null; });
      try {
        const res = await fetch(`/api/skuunAi?page=${page}&perPage=${perPage}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch sessions");

        const validatedSessions = z.array(sessionSchema).parse(data.sessions);
        set((state) => {
          state.sessions = validatedSessions;
          state.total = data.total;
          state.page = data.page;
          state.perPage = data.perPage;
          state.loading = false;
        });
      } catch (err: any) {
        set((state) => { state.error = err.message; state.loading = false; });
      }
    },

    // -------------------- Post User Message with SSE --------------------
    postMessage: async (content, type, sessionId, onChunk, onRecommendationChunk) => {
      const id = sessionId ?? `temp-${Date.now()}`;
      const abortController = new AbortController();

      set((state) => {
        state.activeAbortControllers[id] = abortController;
        state.loading = true;
        state.error = null;
      });

      const tempMessage: SkuunAiMessage = {
        id: `temp-${Date.now()}`,
        content,
        type,
        sender: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: id,
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

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let done = false;

          const aiMessage: SkuunAiMessage = {
            id: `ai-temp-${Date.now()}`,
            content: "",
            type: "TEXT",
            sender: "AI",
            createdAt: new Date(),
            updatedAt: new Date(),
            sessionId: id,
          };
          get().addMessageLocally(id, aiMessage);

          let buffer = "";
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const rec: SkuunAiRecommendation = JSON.parse(line);
                  if (rec?.id && rec?.category) {
                    get().addRecommendationLocally(id, rec);
                    onRecommendationChunk?.(rec);
                  } else {
                    onChunk?.(line);
                    set((state) => {
                      const sIdx = state.sessions.findIndex((s) => s.id === id);
                      if (sIdx > -1) {
                        const mIdx = state.sessions[sIdx].messages.findIndex((m) => m.id === aiMessage.id);
                        if (mIdx > -1) state.sessions[sIdx].messages[mIdx].content += line;
                      }
                    });
                  }
                } catch {
                  onChunk?.(line);
                  set((state) => {
                    const sIdx = state.sessions.findIndex((s) => s.id === id);
                    if (sIdx > -1) {
                      const mIdx = state.sessions[sIdx].messages.findIndex((m) => m.id === aiMessage.id);
                      if (mIdx > -1) state.sessions[sIdx].messages[mIdx].content += line;
                    }
                  });
                }
              }
            }
            done = readerDone;
          }
        }

        await get().triggerInternalActions(id, content, "USER" as Role);
        set((state) => { state.loading = false; });
      } catch (err: any) {
        if (err.name === "AbortError") console.log("Stream cancelled:", id);
        else set((state) => { state.error = err.message });
        set((state) => { state.loading = false; });
      } finally {
        set((state) => { delete state.activeAbortControllers[id]; });
      }
    },

    // -------------------- Post Direct AI Action with SSE --------------------
    postAction: async (type, payload, sessionId, onChunk, onRecommendationChunk) => {
      const abortController = new AbortController();
      set((state) => {
        state.activeAbortControllers[sessionId] = abortController;
        state.loading = true;
        state.error = null;
      });

      const tempActionMessage: SkuunAiMessage = {
        id: `action-temp-${Date.now()}`,
        content: `Triggering AI Action: ${type}`,
        type: "TEXT",
        sender: "SYSTEM",
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId,
      };
      get().addMessageLocally(sessionId, tempActionMessage);

      try {
        const res = await fetch("/api/skuunAi/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, payload, sessionId }),
          signal: abortController.signal,
        });

        if (!res.ok) throw new Error("Failed to post action");

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          const aiMessage: SkuunAiMessage = {
            id: `ai-action-temp-${Date.now()}`,
            content: "",
            type: "TEXT",
            sender: "AI",
            createdAt: new Date(),
            updatedAt: new Date(),
            sessionId,
          };
          get().addMessageLocally(sessionId, aiMessage);

          let buffer = "";
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const rec: SkuunAiRecommendation = JSON.parse(line);
                  if (rec?.id && rec?.category) {
                    get().addRecommendationLocally(sessionId, rec);
                    onRecommendationChunk?.(rec);
                  } else {
                    onChunk?.(line);
                    set((state) => {
                      const sIdx = state.sessions.findIndex((s) => s.id === sessionId);
                      if (sIdx > -1) {
                        const mIdx = state.sessions[sIdx].messages.findIndex((m) => m.id === aiMessage.id);
                        if (mIdx > -1) state.sessions[sIdx].messages[mIdx].content += line;
                      }
                    });
                  }
                } catch {
                  onChunk?.(line);
                  set((state) => {
                    const sIdx = state.sessions.findIndex((s) => s.id === sessionId);
                    if (sIdx > -1) {
                      const mIdx = state.sessions[sIdx].messages.findIndex((m) => m.id === aiMessage.id);
                      if (mIdx > -1) state.sessions[sIdx].messages[mIdx].content += line;
                    }
                  });
                }
              }
            }
            done = readerDone;
          }
        }

        set((state) => { state.loading = false; });
      } catch (err: any) {
        if (err.name === "AbortError") console.log("Action stream cancelled:", sessionId);
        else set((state) => { state.error = err.message });
        set((state) => { state.loading = false; });
      } finally {
        set((state) => { delete state.activeAbortControllers[sessionId]; });
      }
    },

    // -------------------- Cancel Streaming --------------------
    cancelStream: (sessionId) => {
      const controller = get().activeAbortControllers[sessionId];
      if (controller) controller.abort();
    },

    // -------------------- Internal AI Action Triggers --------------------
    triggerInternalActions: async (sessionId, content, role) => {
      try {
        const actions = determineAutoActions(content, role);
        if (!actions.length) return;

        await triggerAutoActions(sessionId, actions, { message: content });

        for (const actionType of actions) {
          const handler = skuunAiActionHandlers[actionType];
          if (!handler) continue;

          const recommendations = await handler({ message: content });
          recommendations.forEach((rec) => {
            const newRec: SkuunAiRecommendation = {
              id: crypto.randomUUID(),
              sessionId,
              category: rec.category,
              message: rec.message,
              data: rec.data,
              targetId: (rec.data as any)?.studentId || null,
              resolved: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            get().addRecommendationLocally(sessionId, newRec);
          });

          const newAction: SkuunAiAction = {
            id: crypto.randomUUID(),
            sessionId,
            type: actionType,
            payload: { message: content },
            status: "EXECUTED",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          get().addActionLocally(sessionId, newAction);
        }
      } catch (err) {
        console.error("Failed internal actions:", err);
      }
    },

    // -------------------- Local State Updaters --------------------
    addMessageLocally: (sessionId, message) => {
      set((state) => {
        const idx = state.sessions.findIndex((s) => s.id === sessionId);
        if (idx > -1) state.sessions[idx].messages.push(message);
      });
    },

    addActionLocally: (sessionId, action) => {
      set((state) => {
        const idx = state.sessions.findIndex((s) => s.id === sessionId);
        if (idx > -1) state.sessions[idx].actions.push(action);
      });
    },

    addRecommendationLocally: (sessionId, recommendation) => {
      set((state) => {
        const idx = state.sessions.findIndex((s) => s.id === sessionId);
        if (idx > -1) state.sessions[idx].SkuunAiRecommendation.push(recommendation);
      });
    },
  }))
);
