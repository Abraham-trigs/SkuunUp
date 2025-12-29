// app/components/skuunAi/SkuunAiChat.tsx
// Purpose: Interactive chat UI for Skuun AI with streaming messages, AI-triggered actions, and recommendations.

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSkuunAiStore } from "@/app/store/useSkuunAiStore";
import type { SkuunAiMessageDTO } from "@/lib/types/skuunAiClientTypes";
import {
  AIActionType,
  MessageType,
  SenderType,
} from "@/lib/types/skuunAiTypes";

// ----------------------- UI Components -----------------------

function MessageBubble({ message }: { message: SkuunAiMessageDTO }) {
  const isUser = message.sender === SenderType.USER;
  const isSystem = message.sender === SenderType.SYSTEM;

  return (
    <div
      className={`max-w-[70%] p-3 my-1 rounded-xl break-words ${
        isUser
          ? "bg-blue-500 text-white self-end"
          : isSystem
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
  message: { id?: string; category: string; message: string };
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
  const actions = [
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
          onClick={() => !disabled && onTrigger(action.type)}
          className={`bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ----------------------- Main Component -----------------------

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamingAbortRef = useRef<AbortController | null>(null);

  const isStreaming = Boolean(streamingAbortRef.current);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!activeSessionId && sessions.length) {
      setActiveSessionId(sessions[sessions.length - 1].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, streamingMessage, streamingRecs]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // ----------------------- Handlers -----------------------

  const handleSend = async () => {
    if (!inputValue.trim() || !activeSessionId || isStreaming) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      sessionId: activeSessionId,
      content: inputValue,
      type: MessageType.TEXT,
      sender: SenderType.USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addMessageLocally(activeSessionId, tempMessage);

    setInputValue("");
    setStreamingMessage("");
    setStreamingRecs([]);
    streamingAbortRef.current = new AbortController();

    try {
      await postMessage(
        tempMessage.content,
        MessageType.TEXT,
        activeSessionId,
        (chunk) => setStreamingMessage((prev) => prev + chunk),
        (rec) => setStreamingRecs((prev) => [...prev, rec])
      );
    } finally {
      setStreamingMessage("");
      setStreamingRecs([]);
      streamingAbortRef.current = null;
    }
  };

  const handleActionTrigger = async (type: AIActionType) => {
    if (!activeSessionId || isStreaming) return;

    const tempSystemMessage = {
      id: `action-temp-${Date.now()}`,
      sessionId: activeSessionId,
      content: `Triggering AI Action: ${type}`,
      type: MessageType.TEXT,
      sender: SenderType.SYSTEM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addMessageLocally(activeSessionId, tempSystemMessage);

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
    } finally {
      setStreamingMessage("");
      setStreamingRecs([]);
      streamingAbortRef.current = null;
    }
  };

  // ----------------------- Render -----------------------

  return (
    <div className="flex flex-col h-full max-h-[80vh] w-full md:w-3/4 lg:w-2/3 mx-auto border rounded-lg shadow-md bg-white">
      {/* Sessions */}
      <div className="flex border-b overflow-x-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`flex-none p-2 border-r last:border-r-0 ${
              session.id === activeSessionId ? "bg-blue-100 font-bold" : ""
            }`}
          >
            {new Date(session.createdAt).toLocaleTimeString()}
          </button>
        ))}
      </div>

      {activeSessionId && (
        <AIActionButtons
          onTrigger={handleActionTrigger}
          disabled={isStreaming}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading && <div className="text-center text-gray-500">Loading…</div>}
        {error && <div className="text-center text-red-500">{error}</div>}

        {activeSession ? (
          <>
            {activeSession.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {streamingMessage && (
              <div className="max-w-[70%] p-3 my-1 rounded-xl break-words bg-gray-100 text-gray-700 italic self-start animate-pulse">
                {streamingMessage}
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

      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-200"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isStreaming}
          placeholder="Type your message…"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
