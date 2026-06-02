export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  metadata_?: RecipeResponse;
  created_at: string;
}

export interface RecipeImage {
  url: string;
  alt: string;
  photographer?: string;
  photographer_url?: string;
}

export interface Recipe {
  title: string;
  description?: string;
  prep_time?: string;
  cook_time?: string;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  tags?: string[];
  source_url?: string;
}

export interface RecipeResponse {
  message: string;
  recipe: Recipe | null;
  image: RecipeImage | null;
}

export interface SSERecipeEvent {
  type: "recipe";
  data: RecipeResponse;
  conversation_id: string;
  message_id: string;
}

export interface SSEDoneEvent {
  type: "done";
}

export interface SSEErrorEvent {
  type: "error";
  message: string;
}

export interface SSEStatusEvent {
  type: "status";
  message: string;
}

export interface SSEChunkEvent {
  type: "chunk";
  text: string;
}

export type SSEEvent =
  | SSERecipeEvent
  | SSEDoneEvent
  | SSEErrorEvent
  | SSEStatusEvent
  | SSEChunkEvent;
