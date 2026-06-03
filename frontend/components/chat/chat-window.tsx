"use client";

import { useRef, useEffect } from "react";
import { RecipeCard } from "@/components/chat/recipe-card";
import { RecipeSkeleton } from "@/components/chat/recipe-skeleton";
import { useChatStore } from "@/store/chat-store";
import type { Message, RecipeResponse } from "@/types";
import { Search, Utensils, Camera, PenTool, ChefHat } from "lucide-react";

/* ── Status step icons for engagement ── */
const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Searching for the perfect recipe…": <Search className="h-4 w-4" />,
  "Finding ingredients & steps…": <Utensils className="h-4 w-4" />,
  "Finding a beautiful photo…": <Camera className="h-4 w-4" />,
  "Writing your recipe…": <PenTool className="h-4 w-4" />,
  "Plating your recipe…": <ChefHat className="h-4 w-4" />,
  "Retrying with a different approach…": <Search className="h-4 w-4" />,
};

const STATUS_STEPS = [
  "Searching for the perfect recipe…",
  "Finding ingredients & steps…",
  "Finding a beautiful photo…",
  "Writing your recipe…",
  "Plating your recipe…",
];

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
  }, [messages, isStreaming, streamStatus]);

  const currentStepIdx = streamStatus
    ? STATUS_STEPS.findIndex((s) => s === streamStatus)
    : -1;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[85%] md:max-w-[70%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-5 py-3.5 text-sm md:text-base neu-flat-sm font-medium leading-relaxed">
                {msg.content}
              </div>
            ) : (
              <div className="w-full max-w-2xl">
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

        {/* ── Agentic Streaming State ── */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="w-full max-w-2xl space-y-4">
              
              {/* Progress Steps Card */}
              <div className="rounded-2xl bg-background neu-flat p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary animate-dot-1" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-dot-2" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-dot-3" />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-muted-foreground ml-2 uppercase tracking-widest">
                    Agent Thinking
                  </span>
                </div>

                {/* Step indicators */}
                <div className="space-y-2.5">
                  {STATUS_STEPS.map((step, idx) => {
                    const isActive = idx === currentStepIdx;
                    const isDone = idx < currentStepIdx;
                    const isPending = idx > currentStepIdx;
                    
                    // Hide future steps until we at least start
                    if (isPending && currentStepIdx < 0) return null;
                    if (isPending) return null;

                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 text-xs md:text-sm py-2 px-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-primary/10 text-primary font-bold shadow-sm"
                            : isDone
                            ? "text-muted-foreground/60 line-through"
                            : "text-muted-foreground/30"
                        }`}
                      >
                        <span className={`shrink-0 ${isActive ? "text-primary animate-pulse" : isDone ? "text-chart-2" : ""}`}>
                          {isDone ? (
                            <svg className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM6.7 11.3l5.3-5.3-1.1-1.1-4.2 4.2-2-2-1 1.1 3 3Z" />
                            </svg>
                          ) : (
                            STATUS_ICONS[step] ?? <Search className="h-4 w-4 md:h-5 md:w-5" />
                          )}
                        </span>
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Streaming text content */}
              {streamingContent && (
                <div className="rounded-2xl bg-background neu-flat p-5 md:p-6 text-sm md:text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {streamingContent.split("```")[0].trim()}
                  <span className="inline-block w-1.5 h-4 md:h-5 ml-1.5 bg-primary animate-cursor align-middle rounded-sm" />
                </div>
              )}

              {/* Skeleton when no content yet but agent is working */}
              {!streamingContent && currentStepIdx >= 3 && <RecipeSkeleton />}
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
