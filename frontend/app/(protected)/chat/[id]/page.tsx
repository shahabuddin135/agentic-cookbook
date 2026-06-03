"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useConversation } from "@/hooks/use-conversations";
import { useChatStore } from "@/store/chat-store";
import { useQueryClient } from "@tanstack/react-query";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatComposer } from "@/components/chat/chat-composer";
import { AgentAvatar } from "@/components/chat/agent";
import type { Message } from "@/types";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const queryClient = useQueryClient();
  const { sendMessage, error, clearError } = useChat();
  const { isStreaming, setActiveConversation } = useChatStore();
  const { data, isLoading } = useConversation(conversationId);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [lastSent, setLastSent] = useState("");

  useEffect(() => {
    setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  // Combine server messages with locally-added ones, filtering out duplicates
  const serverMsgIds = new Set(data?.messages?.map((m) => m.id) ?? []);
  const allMessages = [
    ...(data?.messages ?? []),
    ...localMessages.filter((m) => !serverMsgIds.has(m.id)),
  ];

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      clearError();
      setLastSent(trimmed);
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const result = await sendMessage(trimmed, conversationId);
        const assistantMsg: Message = {
          id: result.messageId,
          conversation_id: result.conversationId,
          role: "assistant",
          content: result.data.message,
          metadata_: result.data,
          image_url: result.data.image?.url,
          created_at: new Date().toISOString(),
        };
        setLocalMessages((prev) => [...prev, assistantMsg]);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch {
        // error surfaced via the hook
      }
    },
    [isStreaming, sendMessage, clearError, conversationId, queryClient]
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <AgentAvatar size="lg" active />
        <p className="text-sm text-muted-foreground">Loading your conversation…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ChatWindow messages={allMessages} isStreaming={isStreaming} />
      <ChatComposer
        value={input}
        onChange={setInput}
        onSend={handleSend}
        busy={isStreaming}
        error={error}
        onRetry={lastSent ? () => handleSend(lastSent) : undefined}
        placeholder="Ask for another recipe…"
      />
    </div>
  );
}
