"use client";

import { useRef, useEffect } from "react";
import { RecipeCard } from "@/components/chat/recipe-card";
import { RecipeSkeleton } from "@/components/chat/recipe-skeleton";
import { useChatStore } from "@/store/chat-store";
import type { Message, RecipeResponse } from "@/types";

interface ChatWindowProps {
  messages: Message[];
  isStreaming: boolean;
}

export function ChatWindow({ messages, isStreaming }: ChatWindowProps) {
  const streamStatus = useChatStore((s) => s.streamStatus);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamStatus]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white text-sm shadow-md">
                {msg.content}
              </div>
            ) : (
              <div className="w-full max-w-xl">
                <RecipeCard
                  data={
                    (msg.metadata_ as RecipeResponse) ?? {
                      message: msg.content,
                      recipe: null,
                      image: null,
                    }
                  }
                />
              </div>
            )}
          </div>
        ))}

        {/* Streaming state */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="w-full max-w-xl space-y-3">
              {streamStatus && (
                <div className="flex items-center gap-2 px-1">
                  <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground animate-pulse">
                    {streamStatus}
                  </span>
                </div>
              )}
              {streamingContent && (
                <div className="prose dark:prose-invert prose-sm bg-white dark:bg-neutral-800 p-4 rounded-xl border border-border shadow-sm whitespace-pre-wrap">
                  {streamingContent.split("```")[0].trim()}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-orange-500 animate-pulse align-middle" />
                </div>
              )}
              {!streamingContent && <RecipeSkeleton />}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
