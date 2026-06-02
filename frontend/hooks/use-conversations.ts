"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import type { Conversation, Message } from "@/types";

const keys = {
  all: ["conversations"] as const,
  detail: (id: string) => ["conversations", id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () =>
      apiGet<{ conversations: Conversation[] }>("/api/conversations").then(
        (r) => r.conversations
      ),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: keys.detail(id!),
    queryFn: () =>
      apiGet<{ conversation: Conversation; messages: Message[] }>(
        `/api/conversations/${id}`
      ),
    enabled: !!id,
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/conversations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });
}
