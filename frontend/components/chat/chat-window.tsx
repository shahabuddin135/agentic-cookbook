"use client";

import { useRef, useEffect } from "react";
import { RecipeCard } from "@/components/chat/recipe-card";
import { AgentThinking } from "@/components/chat/agent-thinking";
import { AgentAvatar, AGENT } from "@/components/chat/agent";
import { useChatStore } from "@/store/chat-store";
import type { Message, RecipeResponse } from "@/types";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface ChatWindowProps {
  messages: Message[];
  isStreaming: boolean;
}

export function ChatWindow({ messages, isStreaming }: ChatWindowProps) {
  const streamStatus = useChatStore((s) => s.streamStatus);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamStatus, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div
              key={msg.id}
              className="flex animate-in fade-in slide-in-from-bottom-2 justify-end duration-300"
            >
              <div className="group max-w-[85%] md:max-w-[75%]">
                <div className="rounded-2xl rounded-br-md bg-primary px-5 py-3.5 text-sm font-medium leading-relaxed text-primary-foreground neu-flat-sm md:text-base">
                  {msg.content}
                </div>
                <div className="mt-1 pr-1 text-right text-[10px] text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70">
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          ) : (
            <div
              key={msg.id}
              className="flex animate-in fade-in slide-in-from-bottom-2 gap-3 duration-300"
            >
              <AgentAvatar />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {AGENT.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <div className="max-w-2xl">
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
              </div>
            </div>
          )
        )}

        {/* ── Live agent response state ── */}
        {isStreaming && <AgentThinking />}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
