const PLACEHOLDER_VALUES = new Set([
  "",
  "supabase_project_url",
  "your-project-url",
  "sb_publishable_...",
  "your-publishable-key",
]);

export function getSupabaseEnvironment() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseEnvironment();
  return (
    Boolean(url && publishableKey) &&
    !PLACEHOLDER_VALUES.has(url) &&
    !PLACEHOLDER_VALUES.has(publishableKey)
  );
}

export function requireSupabaseEnvironment() {
  const environment = getSupabaseEnvironment();

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY per attivare gli account CasaPilot.",
    );
  }

  return environment;
}
