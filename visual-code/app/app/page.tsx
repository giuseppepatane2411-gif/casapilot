import GuimmiaAIHome from "@/components/guimmia-ai/GuimmiaAIHome";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata = createPublicMetadata({
  title: "Guimmia | La tua guida immobiliare intelligente.",
  description:
    "La chat specializzata nell’immobiliare italiano. Domande, documenti, annunci, bozze e valutazioni per vendita, acquisto e affitti a lungo termine, studenti e turistici.",
  path: "/",
  absoluteTitle: true,
});

async function isAuthenticated() {
  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return Boolean(data.user);
  } catch {
    return false;
  }
}

export default async function HomePage() {
  return <GuimmiaAIHome authenticated={await isAuthenticated()} />;
}
