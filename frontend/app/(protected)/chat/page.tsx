"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useChatStore } from "@/store/chat-store";
import { useQueryClient } from "@tanstack/react-query";
import { ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChefHat, Send, Sparkles } from "lucide-react";
import type { Message, RecipeResponse } from "@/types";

const EXAMPLE_PROMPTS = [
  "Give me a quick pasta carbonara recipe",
  "What's a healthy breakfast with avocado?",
  "I want a spicy Thai curry recipe",
  "Show me an easy chocolate cake recipe",
];

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sendMessage, error } = useChat();
  const { isStreaming } = useChatStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: "",
        role: "user",
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const result = await sendMessage(text.trim());
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
        // error is already set via the hook
      }
    },
    [isStreaming, sendMessage, queryClient, router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {hasMessages ? (
        <ChatWindow messages={messages} isStreaming={isStreaming} />
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-lg">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl">
              <ChefHat className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                What are you craving?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Describe any dish and I&apos;ll find you a real recipe with a beautiful photo.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-white dark:bg-neutral-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-700 transition-colors group"
                >
                  <Sparkles className="inline h-3.5 w-3.5 mr-1.5 text-orange-500 group-hover:text-orange-600" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t border-border bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a recipe..."
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
