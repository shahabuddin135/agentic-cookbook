"use client";

import { useChatStore } from "@/store/chat-store";
import { RecipeSkeleton } from "@/components/chat/recipe-skeleton";
import {
  AGENT,
  AGENT_PHASES,
  AgentAvatar,
  phaseIndexForStatus,
} from "@/components/chat/agent";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The agent's live "response state" while a recipe is being generated.
 *
 * Renders the agent avatar + a step-by-step plan that lights up as backend
 * status lines arrive over SSE, plus any partial streaming text and a recipe
 * skeleton once the agent reaches the plating phase.
 */
export function AgentThinking() {
  const streamStatus = useChatStore((s) => s.streamStatus);
  const streamingContent = useChatStore((s) => s.streamingContent);

  const phaseIdx = phaseIndexForStatus(streamStatus);
  // Before any status arrives we're still "thinking"; clamp to the first phase
  // so the plan always shows forward motion.
  const activeIdx = phaseIdx < 0 ? 0 : phaseIdx;
  const headline =
    streamStatus ?? AGENT_PHASES[activeIdx]?.active ?? "Warming up the kitchen…";

  const preview = streamingContent ? streamingContent.split("```")[0].trim() : "";

  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <AgentAvatar active />

      <div className="min-w-0 flex-1 max-w-2xl space-y-3">
        {/* ── Live status header ── */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{AGENT.name}</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
            </span>
            cooking
          </span>
        </div>

        {/* ── Plan / progress card ── */}
        <div className="rounded-2xl bg-card neu-flat p-4 md:p-5 space-y-4">
          {/* Headline + indeterminate sweep */}
          <div className="space-y-2.5">
            <p className="text-sm md:text-base font-semibold text-foreground/90">
              {headline}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-status-bar" />
            </div>
          </div>

          {/* Step plan */}
          <ol className="space-y-1">
            {AGENT_PHASES.map((phase, idx) => {
              const isDone = idx < activeIdx;
              const isActive = idx === activeIdx;
              const Icon = phase.icon;

              return (
                <li
                  key={phase.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-300",
                    isActive && "bg-orange-500/10 font-semibold text-foreground",
                    isDone && "text-muted-foreground/70",
                    !isActive && !isDone && "text-muted-foreground/35"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      isDone && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                      isActive && "bg-orange-500/15 text-orange-600 dark:text-orange-400",
                      !isActive && !isDone && "bg-muted text-muted-foreground/50"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isActive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="truncate">{phase.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── Partial streaming text ── */}
        {preview && (
          <div className="rounded-2xl bg-card neu-flat p-4 md:p-5 text-sm md:text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
            {preview}
            <span className="ml-1 inline-block h-4 w-1.5 translate-y-0.5 rounded-sm bg-orange-500 animate-cursor" />
          </div>
        )}

        {/* ── Recipe skeleton once plating, before the card arrives ── */}
        {!preview && activeIdx >= 3 && <RecipeSkeleton />}
      </div>
    </div>
  );
}
