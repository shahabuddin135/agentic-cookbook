"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useChatStore } from "@/store/chat-store";
import { useQueryClient } from "@tanstack/react-query";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatComposer } from "@/components/chat/chat-composer";
import { AgentAvatar, AGENT } from "@/components/chat/agent";
import { Soup, Salad, Croissant, Flame } from "lucide-react";
import type { Message } from "@/types";

const EXAMPLE_PROMPTS = [
  { icon: Soup, label: "A cozy 30-minute ramen", text: "Give me a cozy 30-minute ramen recipe" },
  { icon: Salad, label: "Healthy avocado breakfast", text: "What's a healthy breakfast with avocado?" },
  { icon: Flame, label: "Spicy Thai green curry", text: "I want a spicy Thai green curry recipe" },
  { icon: Croissant, label: "Easy chocolate cake", text: "Show me an easy chocolate cake recipe" },
];

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sendMessage, error, clearError } = useChat();
  const { isStreaming } = useChatStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSent, setLastSent] = useState("");

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      clearError();
      setLastSent(trimmed);
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: "",
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const result = await sendMessage(trimmed);
        const assistantMsg: Message = {
          id: result.messageId,
          conversation_id: result.conversationId,
          role: "assistant",
          content: result.data.message,
          metadata_: result.data,
          image_url: result.data.image?.url,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        router.push(`/chat/${result.conversationId}`);
      } catch {
        // error surfaced via the hook
      }
    },
    [isStreaming, sendMessage, clearError, queryClient, router]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {hasMessages ? (
        <ChatWindow messages={messages} isStreaming={isStreaming} />
      ) : (
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
          <div className="w-full max-w-xl space-y-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <AgentAvatar size="lg" active={isStreaming} />
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  {AGENT.tagline}
                </span>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  What are you craving?
                </h1>
                <p className="mx-auto max-w-md text-muted-foreground">
                  {AGENT.blurb}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EXAMPLE_PROMPTS.map(({ icon: Icon, label, text }) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  disabled={isStreaming}
                  className="group flex items-center gap-3 rounded-2xl bg-card p-4 text-left neu-flat-sm transition-all hover:-translate-y-0.5 hover:neu-flat disabled:opacity-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 transition-colors group-hover:bg-orange-500/20 dark:text-orange-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ChatComposer
        value={input}
        onChange={setInput}
        onSend={handleSend}
        busy={isStreaming}
        error={error}
        onRetry={lastSent ? () => handleSend(lastSent) : undefined}
        autoFocus={!hasMessages}
      />
    </div>
  );
}
