import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, requireSupabaseEnvironment } from "@/lib/supabase/config";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/registrazione",
  "/forgot-password",
  "/check-email",
  "/terms",
  "/privacy",
  "/professionals",
  "/auth",
  "/api/location-search",
  "/api/location-reverse",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = requireSupabaseEnvironment();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof supabaseResponse.cookies.set>[2] }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const isAuthenticated = Boolean(userId);
  const pathname = request.nextUrl.pathname;
  const requiresOwner = pathname.startsWith("/dashboard") && !isPublicPath(pathname);
  const requiresProfessional = pathname.startsWith("/professionista") && !isPublicPath(pathname);

  if (!isAuthenticated && (requiresOwner || requiresProfessional)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  let roles: string[] = [];
  if (isAuthenticated && userId && (requiresOwner || requiresProfessional || pathname === "/login" || pathname === "/register")) {
    const { data: roleRows } = await supabase.from("app_roles").select("role").eq("user_id", userId);
    roles = (roleRows ?? []).map((row) => row.role);
  }

  const isAdmin = roles.includes("admin");
  const isOwner = roles.includes("owner");
  const isProfessional = roles.includes("professional");

  if (requiresProfessional && !isProfessional && !isAdmin) {
    const target = request.nextUrl.clone();
    target.pathname = "/dashboard";
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (requiresOwner && !isOwner && !isAdmin) {
    const target = request.nextUrl.clone();
    target.pathname = isProfessional ? "/professionista" : "/login";
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    const target = request.nextUrl.clone();
    target.pathname = isProfessional && !isOwner ? "/professionista" : "/dashboard";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return supabaseResponse;
}
