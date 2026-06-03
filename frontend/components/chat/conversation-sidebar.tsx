"use client";

import { useRouter, useParams } from "next/navigation";
import { useConversations, useDeleteConversation } from "@/hooks/use-conversations";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";

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

export function ConversationSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeId = (params?.id as string) ?? null;
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();
  const { setActiveConversation } = useChatStore();

  function handleNew() {
    setActiveConversation(null);
    router.push("/chat");
  }

  function handleSelect(id: string) {
    setActiveConversation(id);
    router.push(`/chat/${id}`);
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
    <div className="flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-900/50 border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={handleNew}
          variant="outline"
          className="w-full justify-start gap-2 bg-white dark:bg-neutral-800 hover:bg-orange-50 dark:hover:bg-orange-950/20"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {conversations?.map((conv) => (
            <div
              key={conv.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") handleSelect(conv.id); }}
              onClick={() => handleSelect(conv.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors group cursor-pointer ${activeId === conv.id
                  ? "bg-orange-100 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground"
                }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">
                  {conv.title || "Untitled chat"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(conv.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-all"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {!isLoading && conversations?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No conversations yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
