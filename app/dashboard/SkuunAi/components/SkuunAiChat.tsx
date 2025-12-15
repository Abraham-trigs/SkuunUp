// app/components/skuunAi/SkuunAiChat.tsx
// Purpose: Interactive chat UI for Skuun AI with streaming messages, AI actions, and recommendations.

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  useSkuunAiStore,
  SkuunAiMessage,
} from "@/app/store/useSkuunAiStore.ts";
import { AIActionType } from "@/lib/types/skuunAiTypes.ts";

// ----------------------- UI Components -----------------------
function MessageBubble({ message }: { message: SkuunAiMessage }) {
  const isUser = message.sender === "USER";
  const isAIAction = message.sender === "SYSTEM";

  return (
    <div
      className={`max-w-[70%] p-3 my-1 rounded-xl break-words ${
        isUser
          ? "bg-blue-500 text-white self-end"
          : isAIAction
          ? "bg-purple-200 text-black self-start italic"
          : "bg-gray-200 text-black self-start"
      }`}
    >
      {message.content}
    </div>
  );
}

function RecommendationItem({
  message,
}: {
  message: { category: string; message: string };
}) {
  return (
    <div className="p-2 border rounded-md my-1 bg-yellow-50 text-sm">
      <strong>{message.category}:</strong> {message.message}
    </div>
  );
}

function AIActionButtons({
  onTrigger,
  disabled,
}: {
  onTrigger: (type: AIActionType) => void;
  disabled?: boolean;
}) {
  const actions: { label: string; type: AIActionType }[] = [
    { label: "Predict Attendance", type: AIActionType.PREDICT_ATTENDANCE },
    { label: "Flag Special Needs", type: AIActionType.FLAG_SPECIAL_NEEDS },
    { label: "Financial Insights", type: AIActionType.FINANCIAL_INSIGHTS },
    { label: "Chat QA", type: AIActionType.CHAT_QA },
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-2">
      {actions.map((action) => (
        <button
          key={action.type}
          className={`bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => !disabled && onTrigger(action.type)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ----------------------- Main Chat Component -----------------------
export default function SkuunAiChat() {
  const {
    sessions,
    fetchSessions,
    postMessage,
    postAction,
    loading,
    error,
    addMessageLocally,
  } = useSkuunAiStore();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingRecs, setStreamingRecs] = useState<any[]>([]);
  const [rollbackBuffer, setRollbackBuffer] = useState<SkuunAiMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamingAbortRef = useRef<AbortController | null>(null);

  const isStreaming = !!streamingAbortRef.current;

  // Fetch all sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-select latest session if none is active
  useEffect(() => {
    if (!activeSessionId && sessions.length) {
      setActiveSessionId(sessions[sessions.length - 1].id);
    }
  }, [sessions, activeSessionId]);

  // Auto-scroll to bottom on new messages or recommendations
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, streamingMessage, streamingRecs]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // ----------------------- Handlers -----------------------
  const handleSend = async () => {
    if (!inputValue.trim() || !activeSessionId || isStreaming) return;

    const previousMessages = activeSession?.messages || [];
    setRollbackBuffer(previousMessages);

    const tempMessage: SkuunAiMessage = {
      id: `temp-${Date.now()}`,
      content: inputValue,
      type: "TEXT",
      sender: "USER",
      createdAt: new Date().toISOString(),
    };
    addMessageLocally(activeSessionId, tempMessage);

    setInputValue("");
    setStreamingMessage("");
    setStreamingRecs([]);
    streamingAbortRef.current = new AbortController();

    try {
      await postMessage(
        inputValue,
        "TEXT",
        activeSessionId,
        (chunk) => setStreamingMessage((prev) => prev + chunk),
        (rec) => setStreamingRecs((prev) => [...prev, rec])
      );

      if (streamingMessage) {
        addMessageLocally(activeSessionId, {
          id: `ai-${Date.now()}`,
          content: streamingMessage,
          type: "TEXT",
          sender: "AI",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      addMessageLocally(activeSessionId, rollbackBuffer);
      console.error("Message streaming failed", err);
    } finally {
      setStreamingMessage("");
      setStreamingRecs([]);
      streamingAbortRef.current = null;
    }
  };

  const handleActionTrigger = async (type: AIActionType) => {
    if (!activeSessionId || isStreaming) return;

    const previousMessages = activeSession?.messages || [];
    setRollbackBuffer(previousMessages);

    const tempActionMessage: SkuunAiMessage = {
      id: `action-temp-${Date.now()}`,
      content: `Triggering AI Action: ${type}`,
      type: "TEXT",
      sender: "SYSTEM",
      createdAt: new Date().toISOString(),
    };
    addMessageLocally(activeSessionId, tempActionMessage);

    setStreamingMessage("");
    setStreamingRecs([]);
    streamingAbortRef.current = new AbortController();

    try {
      await postAction(
        type,
        {},
        activeSessionId,
        (chunk) => setStreamingMessage((prev) => prev + chunk),
        (rec) => setStreamingRecs((prev) => [...prev, rec])
      );

      if (streamingMessage) {
        addMessageLocally(activeSessionId, {
          id: `ai-action-${Date.now()}`,
          content: streamingMessage,
          type: "TEXT",
          sender: "AI",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      addMessageLocally(activeSessionId, rollbackBuffer);
      console.error("AI action streaming failed", err);
    } finally {
      setStreamingMessage("");
      setStreamingRecs([]);
      streamingAbortRef.current = null;
    }
  };

  const handleCancelStreaming = () => {
    streamingAbortRef.current?.abort();
    setStreamingMessage("");
    setStreamingRecs([]);
  };

  // ----------------------- Render -----------------------
  return (
    <div className="flex flex-col h-full max-h-[80vh] w-full md:w-3/4 lg:w-2/3 mx-auto border rounded-lg shadow-md bg-white">
      {/* Sessions List */}
      <div className="flex border-b overflow-x-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`flex-none p-2 text-center border-r last:border-r-0 ${
              session.id === activeSessionId ? "bg-blue-100 font-bold" : ""
            }`}
          >
            {new Date(session.createdAt).toLocaleTimeString()}
          </button>
        ))}
      </div>

      {/* AI Action Buttons */}
      {activeSessionId && (
        <AIActionButtons
          onTrigger={handleActionTrigger}
          disabled={isStreaming}
        />
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {error && <div className="text-red-500 text-center">{error}</div>}

        {activeSession ? (
          <>
            {activeSession.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {streamingMessage && (
              <div className="bg-gray-100 p-2 rounded-md text-gray-800 my-1 flex justify-between items-center italic">
                <span>{streamingMessage}</span>
                <button
                  className="text-red-500 ml-2 text-sm font-bold"
                  onClick={handleCancelStreaming}
                >
                  Cancel
                </button>
              </div>
            )}

            {activeSession.SkuunAiRecommendation.concat(streamingRecs).map(
              (rec) => (
                <RecommendationItem key={rec.id} message={rec} />
              )
            )}

            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center text-gray-400 mt-10">
            Select a session to view messages
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          className={`flex-1 border rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-200 ${
            isStreaming ? "opacity-50 cursor-not-allowed" : ""
          }`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={isStreaming}
        >
          Send
        </button>
      </div>
    </div>
  );
}
// app/components/skuunAi/SkuunAiChat.tsx
// Purpose: Interactive chat UI for Skuun AI with streaming messages, AI-triggered actions, and recommendations.

("use client");

import React, { useEffect, useRef, useState } from "react";
import {
  useSkuunAiStore,
  SkuunAiMessage,
} from "@/app/store/useSkuunAiStore.ts";
import { AIActionType } from "@/lib/types/skuunAiTypes.ts";

// ----------------------- UI Components -----------------------

// Message bubble for individual chat messages
function MessageBubble({ message }: { message: SkuunAiMessage }) {
  const isUser = message.sender === "USER";
  const isAIAction = message.sender === "SYSTEM";

  return (
    <div
      className={`max-w-[70%] p-3 my-1 rounded-xl break-words ${
        isUser
          ? "bg-blue-500 text-white self-end"
          : isAIAction
          ? "bg-purple-200 text-black self-start italic"
          : "bg-gray-200 text-black self-start"
      }`}
    >
      {message.content}
    </div>
  );
}

// Recommendation display item
function RecommendationItem({
  message,
}: {
  message: { category: string; message: string; id?: string };
}) {
  return (
    <div className="p-2 border rounded-md my-1 bg-yellow-50 text-sm">
      <strong>{message.category}:</strong> {message.message}
    </div>
  );
}

// Action buttons for AI triggers
function AIActionButtons({
  onTrigger,
  disabled,
}: {
  onTrigger: (type: AIActionType) => void;
  disabled?: boolean;
}) {
  const actions: { label: string; type: AIActionType }[] = [
    { label: "Predict Attendance", type: AIActionType.PREDICT_ATTENDANCE },
    { label: "Flag Special Needs", type: AIActionType.FLAG_SPECIAL_NEEDS },
    { label: "Financial Insights", type: AIActionType.FINANCIAL_INSIGHTS },
    { label: "Chat QA", type: AIActionType.CHAT_QA },
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-2">
      {actions.map((action) => (
        <button
          key={action.type}
          className={`bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => !disabled && onTrigger(action.type)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ----------------------- Main Chat Component -----------------------
export default function SkuunAiChat() {
  const {
    sessions,
    fetchSessions,
    postMessage,
    postAction,
    loading,
    error,
    addMessageLocally,
  } = useSkuunAiStore();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingRecs, setStreamingRecs] = useState<any[]>([]);
  const [rollbackBuffer, setRollbackBuffer] = useState<SkuunAiMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamingAbortRef = useRef<AbortController | null>(null);

  const isStreaming = !!streamingAbortRef.current;

  // Fetch all sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-select the latest session if none active
  useEffect(() => {
    if (!activeSessionId && sessions.length) {
      setActiveSessionId(sessions[sessions.length - 1].id);
    }
  }, [sessions, activeSessionId]);

  // Auto-scroll to bottom whenever messages or recommendations update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, streamingMessage, streamingRecs]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // ----------------------- Handlers -----------------------

  // Send a user message
  const handleSend = async () => {
    if (!inputValue.trim() || !activeSessionId || isStreaming) return;

    // Preserve previous messages for rollback in case of failure
    const previousMessages = activeSession?.messages || [];
    setRollbackBuffer(previousMessages);

    // Optimistically render the user message
    const tempMessage: SkuunAiMessage = {
      id: `temp-${Date.now()}`,
      content: inputValue,
      type: "TEXT",
      sender: "USER",
      createdAt: new Date().toISOString(),
    };
    addMessageLocally(activeSessionId, tempMessage);

    // Reset input and streaming state
    setInputValue("");
    setStreamingMessage("");
    setStreamingRecs([]);
    streamingAbortRef.current = new AbortController();

    try {
      await postMessage(
        inputValue,
        "TEXT",
        activeSessionId,
        (chunk) => setStreamingMessage((prev) => prev + chunk), // streaming callback
        (rec) => setStreamingRecs((prev) => [...prev, rec]) // streaming recommendation callback
      );

      if (streamingMessage) {
        addMessageLocally(activeSessionId, {
          id: `ai-${Date.now()}`,
          content: streamingMessage,
          type: "TEXT",
          sender: "AI",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Rollback in case of streaming failure
      addMessageLocally(activeSessionId, rollbackBuffer);
      console.error("Message streaming failed", err);
    } finally {
      setStreamingMessage("");
      setStreamingRecs([]);
      streamingAbortRef.current = null;
    }
  };

  // Trigger an AI action
  const handleActionTrigger = async (type: AIActionType) => {
    if (!activeSessionId || isStreaming) return;

    const previousMessages = activeSession?.messages || [];
    setRollbackBuffer(previousMessages);

    // Optimistically render system message
    const tempActionMessage: SkuunAiMessage = {
      id: `action-temp-${Date.now()}`,
      content: `Triggering AI Action: ${type}`,
      type: "TEXT",
      sender: "SYSTEM",
      createdAt: new Date().toISOString(),
    };
    addMessageLocally(activeSessionId, tempActionMessage);

    setStreamingMessage("");
    setStreamingRecs([]);
    streamingAbortRef.current = new AbortController();

    try {
      await postAction(
        type,
        {},
        activeSessionId,
        (chunk) => setStreamingMessage((prev) => prev + chunk),
        (rec) => setStreamingRecs((prev) => [...prev, rec])
      );

      if (streamingMessage) {
        addMessageLocally(activeSessionId, {
          id: `ai-action-${Date.now()}`,
          content: streamingMessage,
          type: "TEXT",
          sender: "AI",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      addMessageLocally(activeSessionId, rollbackBuffer);
      console.error("AI action streaming failed", err);
    } finally {
      setStreamingMessage("");
      setStreamingRecs([]);
      streamingAbortRef.current = null;
    }
  };

  // Cancel ongoing streaming
  const handleCancelStreaming = () => {
    streamingAbortRef.current?.abort();
    setStreamingMessage("");
    setStreamingRecs([]);
  };

  // ----------------------- Render -----------------------
  return (
    <div className="flex flex-col h-full max-h-[80vh] w-full md:w-3/4 lg:w-2/3 mx-auto border rounded-lg shadow-md bg-white">
      {/* Sessions List */}
      <div className="flex border-b overflow-x-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`flex-none p-2 text-center border-r last:border-r-0 ${
              session.id === activeSessionId ? "bg-blue-100 font-bold" : ""
            }`}
          >
            {new Date(session.createdAt).toLocaleTimeString()}
          </button>
        ))}
      </div>

      {/* AI Action Buttons */}
      {activeSessionId && (
        <AIActionButtons
          onTrigger={handleActionTrigger}
          disabled={isStreaming}
        />
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {error && <div className="text-red-500 text-center">{error}</div>}

        {activeSession ? (
          <>
            {activeSession.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {streamingMessage && (
              <div className="bg-gray-100 p-2 rounded-md text-gray-800 my-1 flex justify-between items-center italic">
                <span>{streamingMessage}</span>
                <button
                  className="text-red-500 ml-2 text-sm font-bold"
                  onClick={handleCancelStreaming}
                >
                  Cancel
                </button>
              </div>
            )}

            {activeSession.SkuunAiRecommendation.concat(streamingRecs).map(
              (rec) => (
                <RecommendationItem
                  key={rec.id || `rec-${Date.now()}`}
                  message={rec}
                />
              )
            )}

            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center text-gray-400 mt-10">
            Select a session to view messages
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          className={`flex-1 border rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-200 ${
            isStreaming ? "opacity-50 cursor-not-allowed" : ""
          }`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={isStreaming}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/*
Design reasoning:
- Optimistic rendering improves UX by immediately showing user input and AI/system actions.
- Streaming updates for messages and recommendations provide live feedback.
- Rollback buffer ensures safe recovery in case of network or streaming failures.

Structure:
- Sessions displayed as selectable buttons.
- Messages are shown chronologically; streaming messages are highlighted.
- Recommendations appended below messages.
- Input box with enter-key handling and disabled state during streaming.

Implementation guidance:
- Maintain rollback buffer for safe error recovery.
- AbortController allows canceling active streaming for responsiveness.
- Use refs to auto-scroll to bottom on new messages/recommendations.

Scalability insight:
- Supports multiple sessions, streaming AI outputs, and dynamic recommendations.
- UI components are isolated for easier future feature extensions.
- Can scale with larger sessions by implementing virtualized lists for messages if needed.
*/
