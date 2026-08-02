import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnvironment } from "@/lib/supabase/config";

export function createClient() {
  const { url, publishableKey } = requireSupabaseEnvironment();
  return createBrowserClient(url, publishableKey);
}
