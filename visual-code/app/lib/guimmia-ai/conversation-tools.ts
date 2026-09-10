import type { SupabaseClient } from "@supabase/supabase-js";
import { isGuimmiaAssistantFocus, type GuimmiaAIConversation, type GuimmiaAIMessage } from "./types";

const conversationColumns = "id,project_id,title,focus,created_at,updated_at";

export function conversationPath(id?: string | null) {
  return id ? `/ai?conversation=${encodeURIComponent(id)}` : "/ai";
}

export function unansweredQuestion(messages: GuimmiaAIMessage[], conversationId: string | null) {
  const last = messages.at(-1);
  return last?.role === "user" && last.conversation_id === conversationId ? last : null;
}

export function questionFocus(message: GuimmiaAIMessage) {
  return isGuimmiaAssistantFocus(message.metadata?.focus) ? message.metadata.focus : "GENERAL";
}

export async function loadOwnedConversation(client: SupabaseClient, userId: string, id: string) {
  const { data, error } = await client.from("guimmia_ai_conversations")
    .select(conversationColumns).eq("user_id", userId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as GuimmiaAIConversation | null;
}

export async function updateOwnedConversation(client: SupabaseClient, userId: string, id: string, title: string, projectId: string | null) {
  const normalizedTitle = title.replace(/\s+/g, " ").trim().slice(0, 120);
  if (!normalizedTitle) throw new Error("empty_conversation_title");
  const { data, error } = await client.from("guimmia_ai_conversations")
    .update({ title: normalizedTitle, project_id: projectId })
    .eq("user_id", userId).eq("id", id).select(conversationColumns).maybeSingle();
  // A 200 response with zero rows is not a confirmed update under RLS.
  if (error || !data || data.id !== id || data.title !== normalizedTitle || data.project_id !== projectId) {
    throw new Error("conversation_update_unconfirmed");
  }
  return data as GuimmiaAIConversation;
}
