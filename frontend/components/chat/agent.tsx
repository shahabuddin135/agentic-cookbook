"use client";

import type { ComponentType } from "react";
import { ChefHat, Search, Brain, Utensils, Camera, CookingPot } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   The recipe agent's identity. Centralised so every surface (avatar, empty
   state, thinking bubble, message header) speaks with one voice.
   ────────────────────────────────────────────────────────────────────────── */
export const AGENT = {
  name: "Sous Chef",
  tagline: "Your AI recipe agent",
  blurb: "Describe any dish or craving and I'll hunt down a real recipe — with a beautiful photo to match.",
} as const;

export type AgentPhaseId = "thinking" | "searching" | "gathering" | "photo" | "plating";

export interface AgentPhase {
  id: AgentPhaseId;
  /** Calm label shown in the agent's plan. */
  label: string;
  /** Present-tense fallback used when the backend doesn't send a status line. */
  active: string;
  icon: ComponentType<{ className?: string }>;
  /** Lower-cased substrings used to map a free-form status line onto this phase. */
  keywords: string[];
}

/* The ordered "plan" the agent works through. Backend status strings are
   matched onto these phases by keyword, so wording changes degrade gracefully. */
export const AGENT_PHASES: AgentPhase[] = [
  {
    id: "thinking",
    label: "Understanding your craving",
    active: "Reading your request…",
    icon: Brain,
    keywords: ["think", "read", "understand", "analy", "warming"],
  },
  {
    id: "searching",
    label: "Searching trusted recipes",
    active: "Searching for the perfect recipe…",
    icon: Search,
    keywords: ["search", "look", "retry", "different approach"],
  },
  {
    id: "gathering",
    label: "Gathering ingredients & steps",
    active: "Collecting ingredients & steps…",
    icon: Utensils,
    keywords: ["ingredient", "step"],
  },
  {
    id: "photo",
    label: "Finding a beautiful photo",
    active: "Finding a beautiful photo…",
    icon: Camera,
    keywords: ["photo", "image", "picture", "beautiful"],
  },
  {
    id: "plating",
    label: "Plating your recipe",
    active: "Writing & plating your recipe…",
    icon: CookingPot,
    keywords: ["writ", "plat", "format", "finish"],
  },
];

/** Map a free-form status line to the furthest phase it implies, or -1. */
export function phaseIndexForStatus(status: string | null): number {
  if (!status) return -1;
  const s = status.toLowerCase();
  let idx = -1;
  AGENT_PHASES.forEach((p, i) => {
    if (p.keywords.some((k) => s.includes(k))) idx = i;
  });
  return idx;
}

const SIZES = {
  sm: { box: "h-8 w-8 rounded-xl", icon: "h-4 w-4", radius: "rounded-xl" },
  md: { box: "h-10 w-10 rounded-2xl", icon: "h-5 w-5", radius: "rounded-2xl" },
  lg: { box: "h-16 w-16 rounded-3xl", icon: "h-8 w-8", radius: "rounded-3xl" },
} as const;

interface AgentAvatarProps {
  size?: keyof typeof SIZES;
  /** When true, a soft pulsing ring radiates to signal the agent is working. */
  active?: boolean;
  className?: string;
}

export function AgentAvatar({ size = "md", active = false, className }: AgentAvatarProps) {
  const s = SIZES[size];
  return (
    <div className={cn("relative shrink-0", className)}>
      {active && (
        <span
          className={cn(
            "absolute inset-0 bg-orange-500/40 animate-ping-slow",
            s.radius
          )}
        />
      )}
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg ring-1 ring-white/20",
          s.box,
          active && "shadow-orange-500/30"
        )}
      >
        <ChefHat className={s.icon} />
      </div>
    </div>
  );
}
