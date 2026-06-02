import { create } from "zustand";

interface ChatStore {
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  /** Latest friendly progress line streamed from the agent (e.g. "Finding a photo…"). */
  streamStatus: string | null;
  setActiveConversation: (id: string | null) => void;
  setStreaming: (v: boolean) => void;
  appendStreamChunk: (chunk: string) => void;
  setStreamStatus: (s: string | null) => void;
  resetStream: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConversationId: null,
  isStreaming: false,
  streamingContent: "",
  streamStatus: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setStreaming: (v) => set({ isStreaming: v }),
  appendStreamChunk: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  setStreamStatus: (s) => set({ streamStatus: s }),
  resetStream: () =>
    set({ streamingContent: "", isStreaming: false, streamStatus: null }),
}));
