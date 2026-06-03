"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, RotateCcw, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string) => void;
  /** Agent is busy generating — input is locked and the button shows a spinner. */
  busy?: boolean;
  error?: string | null;
  /** Shown as a "Try again" affordance next to an error. */
  onRetry?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  busy = false,
  error,
  onRetry,
  placeholder = "Ask for a recipe… e.g. \"a cozy 30-minute ramen\"",
  autoFocus = false,
}: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    if (!value.trim() || busy) return;
    onSend(value.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border/60 bg-background/80 px-4 py-4 backdrop-blur-lg">
      <div className="mx-auto max-w-3xl">
        {error && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-bottom-1">
            <span className="min-w-0 truncate">{error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-1 font-medium underline-offset-2 hover:underline disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Try again
              </button>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl bg-card p-2 neu-pressed transition-shadow",
            "focus-within:ring-2 focus-within:ring-primary/40"
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={busy}
            rows={1}
            autoFocus={autoFocus}
            className="max-h-40 min-h-[2.75rem] field-sizing-content flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 disabled:opacity-60 md:text-base"
          />
          <Button
            onClick={submit}
            disabled={!value.trim() || busy}
            size="icon-lg"
            className="shrink-0 self-end rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md transition-transform hover:from-orange-600 hover:to-amber-600 disabled:opacity-40"
            aria-label="Send message"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="mt-2 hidden items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/60 sm:flex">
          <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
            <CornerDownLeft className="h-2.5 w-2.5" /> Enter
          </kbd>
          to send ·
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
            Shift + Enter
          </kbd>
          for a new line
        </p>
      </div>
    </div>
  );
}
