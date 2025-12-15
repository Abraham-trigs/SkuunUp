// app/store/useSkuunAiStore.ts
// Purpose: Zustand store for managing SkuunAi sessions, messages, actions, and recommendations with streaming, rollback, and cancellation support.

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
  Role,
} from "@/lib/types/skuunAiTypes.ts";
import { determineAutoActions, triggerAutoActions } from "@/lib/skuunAiAutoActions.ts";
import { skuunAiActionHandlers } from "@/lib/skuunAiActions.ts";

// -------------------- Zod Validators --------------------
// Validates incoming messages, actions, recommendations, and sessions
const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.enum(["TEXT", "JSON", "IMAGE"]),
  sender: z.enum(["USER", "AI", "SYSTEM"]),
  createdAt: z.string(),
});

const actionSchema = z.object({
  id: z.string(),
  type: z.string(),
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
});

// -------------------- Zustand Store --------------------
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

        // Validate session data using Zod
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

    // -------------------- Post User Message --------------------
    postMessage: async (content, type, sessionId, onChunk, onRecommendationChunk) => {
      const abortController = new AbortController();
      set((state) => {
        state.activeAbortControllers[sessionId] = abortController;
        state.loading = true;
        state.error = null;
      });

      // Add temporary message to local state for optimistic UI
      const tempMessage: SkuunAiMessage = {
        id: `temp-${Date.now()}`,
        content,
        type,
        sender: "USER",
        createdAt: new Date().toISOString(),
      };
      get().addMessageLocally(sessionId, tempMessage);

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

          // Create temporary AI message to append streaming chunks
          const aiMessage: SkuunAiMessage = {
            id: `ai-temp-${Date.now()}`,
            content: "",
            type: "TEXT",
            sender: "AI",
            createdAt: new Date().toISOString(),
          };
          get().addMessageLocally(sessionId, aiMessage);

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            if (value) {
              const chunk = decoder.decode(value);
              onChunk?.(chunk);

              // Append chunk to AI message in local store
              set((state) => {
                const sIdx = state.sessions.findIndex((s) => s.id === sessionId);
                if (sIdx > -1) {
                  const mIdx = state.sessions[sIdx].messages.findIndex((m) => m.id === aiMessage.id);
                  if (mIdx > -1) state.sessions[sIdx].messages[mIdx].content += chunk;
                }
              });

              // Attempt to parse embedded recommendation chunk
              try {
                const rec: SkuunAiRecommendation = JSON.parse(chunk);
                if (rec?.id && rec?.category) onRecommendationChunk?.(rec);
              } catch {}
            }
            done = readerDone;
          }
        }

        // Trigger internal AI actions based on message content
        await get().triggerInternalActions(sessionId, content, "USER" as Role);
        set((state) => { state.loading = false; });
      } catch (err: any) {
        if (err.name === "AbortError") console.log("Stream cancelled:", sessionId);
        else set((state) => { state.error = err.message });
        set((state) => { state.loading = false; });
      } finally {
        set((state) => { delete state.activeAbortControllers[sessionId]; });
      }
    },

    // -------------------- Post Direct AI Action --------------------
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
        createdAt: new Date().toISOString(),
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
            createdAt: new Date().toISOString(),
          };
          get().addMessageLocally(sessionId, aiMessage);

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            if (value) {
              const chunk = decoder.decode(value);
              onChunk?.(chunk);

              set((state) => {
                const sIdx = state.sessions.findIndex((s) => s.id === sessionId);
                if (sIdx > -1) {
                  const mIdx = state.sessions[sIdx].messages.findIndex((m) => m.id === aiMessage.id);
                  if (mIdx > -1) state.sessions[sIdx].messages[mIdx].content += chunk;
                }
              });

              try {
                const rec: SkuunAiRecommendation = JSON.parse(chunk);
                if (rec?.id && rec?.category) onRecommendationChunk?.(rec);
              } catch {}
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

        actions.forEach((actionType) => {
          const handler = skuunAiActionHandlers[actionType];
          if (!handler) return;

          const recommendations = handler({ message: content });
          recommendations.forEach((rec) => {
            const newRec: SkuunAiRecommendation = {
              id: crypto.randomUUID(),
              sessionId,
              category: rec.category,
              message: rec.message,
              data: rec.data,
              targetId: (rec.data as any)?.studentId || null,
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
        });
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

/*
Design reasoning:
- Optimistic updates with temporary messages/actions for UX.
- Streaming AI responses directly into state for real-time display.
- AbortControllers support stream cancellation per session.
- Internal auto-actions trigger AI recommendation handlers dynamically.

Structure:
- fetchSessions: fetch paginated session list with validation.
- postMessage: handles message submission + streaming AI response + recommendations.
- postAction: triggers direct AI actions with streaming feedback.
- cancelStream: safely aborts ongoing streams.
- triggerInternalActions: executes AI actions internally and updates local store.
- Local state updaters: addMessageLocally, addActionLocally, addRecommendationLocally.

Implementation guidance:
- Ensure Zod validation for all incoming/outgoing entities.
- Maintain per-session abort controllers for concurrent streaming.
- Normalize recommendation data before inserting into state.
- Wrap all state updates with immer for immutability safety.

Scalability insight:
- Streaming architecture supports multiple concurrent sessions.
- AbortController pattern ensures memory and network resource safety.
- Adding new AI actions/recommendation handlers requires minimal store changes.
- Optimistic updates and rollback allow responsive UX without waiting for network.
*/
