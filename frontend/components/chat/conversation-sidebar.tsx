"use client";

import { useRouter, useParams } from "next/navigation";
import { useConversations, useDeleteConversation } from "@/hooks/use-conversations";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageSquare, Loader2, X } from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface ConversationSidebarProps {
  onClose?: () => void;
}

export function ConversationSidebar({ onClose }: ConversationSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const activeId = (params?.id as string) ?? null;
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();
  const { setActiveConversation } = useChatStore();

  function handleNew() {
    setActiveConversation(null);
    router.push("/chat");
    onClose?.();
  }

  function handleSelect(id: string) {
    setActiveConversation(id);
    router.push(`/chat/${id}`);
    onClose?.();
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (activeId === id) router.push("/chat");
      },
    });
  }

  return (
    <div className="flex flex-col h-full bg-background/80 backdrop-blur-sm border-r border-border/10">
      {/* Header */}
      <div className="p-4 flex items-center gap-2 shrink-0">
        <Button
          onClick={handleNew}
          variant="ghost"
          className="flex-1 justify-start gap-3 rounded-xl neu-interactive bg-background text-foreground text-sm md:text-base font-bold h-12 md:h-11 shadow-sm hover:text-primary transition-colors"
        >
          <Plus className="h-5 w-5 md:h-4 md:w-4 text-primary" />
          New Recipe
        </Button>
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-3 rounded-xl neu-flat-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* List - Native overflow for perfect scrolling */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {conversations?.map((conv) => (
          <div
            key={conv.id}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") handleSelect(conv.id); }}
            onClick={() => handleSelect(conv.id)}
            className={`w-full flex items-center gap-3 p-3 md:px-3 md:py-2.5 rounded-xl text-left text-sm transition-all group cursor-pointer ${
              activeId === conv.id
                ? "neu-pressed bg-primary/10 text-primary font-bold shadow-inner"
                : "hover:neu-flat-sm hover:-translate-y-px hover:bg-background text-foreground"
            }`}
          >
            <MessageSquare className={`h-5 w-5 md:h-4 md:w-4 shrink-0 ${activeId === conv.id ? "text-primary" : "text-muted-foreground"}`} />
            
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] md:text-xs">
                {conv.title || "Untitled chat"}
              </p>
              <p className="text-[11px] md:text-[10px] text-muted-foreground font-mono mt-0.5 opacity-70">
                {timeAgo(conv.updated_at)}
              </p>
            </div>
            
            <button
              onClick={(e) => handleDelete(e, conv.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
            </button>
          </div>
        ))}
        
        {!isLoading && conversations?.length === 0 && (
          <div className="text-center py-12 px-4 mt-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 neu-flat-sm mb-4">
              <MessageSquare className="h-6 w-6 text-primary/60" />
            </div>
            <p className="text-sm text-foreground font-bold">
              No recipes yet
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Start by asking the agent for a healthy meal idea.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
