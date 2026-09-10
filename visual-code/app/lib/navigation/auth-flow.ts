export type AuthAccountType = "private" | "professional";

export type PageSearchParams = Record<
  string,
  string | string[] | undefined
>;

const INTERNAL_ORIGIN = "https://guimmia.local";
const MAX_NEXT_PATH_LENGTH = 4096;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function firstSearchParam(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function safeNextPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (
    !value ||
    value.length > MAX_NEXT_PATH_LENGTH ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    CONTROL_CHARACTERS.test(value)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(value, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function resolveAuthNextPath({
  next,
  goal,
  message,
  intent,
  brand,
  accountType = "private",
  fallback,
}: {
  next?: string | null;
  goal?: string | null;
  message?: string | null;
  intent?: string | null;
  brand?: string | null;
  accountType?: AuthAccountType;
  fallback?: string;
}): string {
  const explicitNext = safeNextPath(next, "");
  if (explicitNext) return explicitNext;

  if (accountType === "professional") {
    return safeNextPath(fallback, "/professionista/onboarding");
  }

  if (goal === "sale" || goal === "rent") {
    const params = new URLSearchParams({ goal });
    return `/dashboard/properties/new?${params.toString()}`;
  }

  if (message || intent || brand) {
    const params = new URLSearchParams();
    if (message) params.set("message", message);
    if (intent) params.set("intent", intent);
    if (brand) params.set("brand", brand);
    return `/dashboard/pilot?${params.toString()}`;
  }

  return safeNextPath(fallback, "/dashboard");
}

export function buildAuthPath(
  pathname: "/login" | "/register" | "/check-email",
  {
    next,
    accountType,
    error,
  }: {
    next?: string | null;
    accountType?: AuthAccountType;
    error?: string | null;
  } = {},
): string {
  const params = new URLSearchParams();
  const resolvedNext = safeNextPath(next, "");

  if (accountType) params.set("type", accountType);
  if (resolvedNext) params.set("next", resolvedNext);
  if (error) params.set("error", error);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildPathWithSearchParams(
  pathname: string,
  source: PageSearchParams,
  defaults: Record<string, string> = {},
): string {
  const params = new URLSearchParams(defaults);

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      params.delete(key);
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
