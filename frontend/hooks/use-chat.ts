"use client";

import { useCallback, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { apiFetch } from "@/lib/api";
import type { RecipeResponse, SSEEvent } from "@/types";

interface SendResult {
  conversationId: string;
  data: RecipeResponse;
  messageId: string;
}

export function useChat() {
  const { setStreaming, resetStream, setActiveConversation, setStreamStatus, appendStreamChunk } =
    useChatStore();
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string, conversationId?: string): Promise<SendResult> => {
      setError(null);
      // resetStream() clears isStreaming, so flip streaming ON afterwards —
      // otherwise the agent response state never shows during the stream.
      resetStream();
      setStreaming(true);

      try {
        const response = await apiFetch("/api/agent/chat", {
          method: "POST",
          headers: {
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            message,
            conversation_id: conversationId ?? undefined,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
          }
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload: SSEEvent = JSON.parse(line.slice(6));

            if (payload.type === "status") {
              setStreamStatus(payload.message);
              continue;
            }
            if (payload.type === "chunk") {
              appendStreamChunk(payload.text);
              continue;
            }
            if (payload.type === "recipe") {
              setStreaming(false);
              setStreamStatus(null);
              setActiveConversation(payload.conversation_id);
              return {
                conversationId: payload.conversation_id,
                data: payload.data,
                messageId: payload.message_id,
              };
            }
            if (payload.type === "error") {
              throw new Error(payload.message);
            }
          }
        }

        throw new Error("Stream ended without a recipe event");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        throw err;
      } finally {
        setStreaming(false);
        setStreamStatus(null);
      }
    },
    [setStreaming, resetStream, setActiveConversation, setStreamStatus, appendStreamChunk]
  );

  return { sendMessage, error, clearError: () => setError(null) };
}
