import type { Metadata } from "next";
import { redirect } from "next/navigation";

import GuimmiaAIWorkspace from "@/components/guimmia-ai/GuimmiaAIWorkspace";
import {
  isGuimmiaAssistantFocus,
  type GuimmiaAssistantFocus,
} from "@/lib/guimmia-ai/types";
import {
  buildAuthPath,
  buildPathWithSearchParams,
  firstSearchParam,
  type PageSearchParams,
} from "@/lib/navigation/auth-flow";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Chat",
  description: "Il tuo spazio di lavoro immobiliare con Guimmia.",
  robots: { index: false, follow: false },
};

export default async function GuimmiaAIPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  if (!isSupabaseConfigured()) {
    redirect(
      buildAuthPath("/login", {
        next: buildPathWithSearchParams("/ai", resolvedSearchParams),
      }),
    );
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(
      buildAuthPath("/login", {
        next: buildPathWithSearchParams("/ai", resolvedSearchParams),
      }),
    );
  }

  const rawFocus = firstSearchParam(resolvedSearchParams.focus);
  const initialFocus: GuimmiaAssistantFocus = isGuimmiaAssistantFocus(rawFocus)
    ? rawFocus
    : "GENERAL";
  const initialMessage = (
    firstSearchParam(resolvedSearchParams.message) ?? ""
  ).slice(0, 2000);
  const rawConversationId = firstSearchParam(
    resolvedSearchParams.conversation,
  );
  const initialConversationId =
    rawConversationId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      rawConversationId,
    )
      ? rawConversationId
      : undefined;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return (
    <GuimmiaAIWorkspace
      userId={data.user.id}
      userName={profile?.full_name || data.user.email?.split("@")[0] || "Utente"}
      userEmail={data.user.email ?? ""}
      initialMessage={initialMessage}
      initialFocus={initialFocus}
      initialConversationId={initialConversationId}
    />
  );
}
