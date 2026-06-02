"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useConversation } from "@/hooks/use-conversations";
import { useChatStore } from "@/store/chat-store";
import { useQueryClient } from "@tanstack/react-query";
import { ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import type { Message } from "@/types";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const queryClient = useQueryClient();
  const { sendMessage, error } = useChat();
  const { isStreaming, setActiveConversation } = useChatStore();
  const { data, isLoading } = useConversation(conversationId);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

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
      if (!text.trim() || isStreaming) return;
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "user",
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const result = await sendMessage(text.trim(), conversationId);
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
        // error handled by hook
      }
    },
    [isStreaming, sendMessage, conversationId, queryClient]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      <ChatWindow messages={allMessages} isStreaming={isStreaming} />

      {/* Input Bar */}
      <div className="border-t border-border bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for another recipe..."
            disabled={isStreaming}
            rows={1}
            className="resize-none min-h-[44px] max-h-32 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
          />
          <Button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
