import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type RoleAccess = {
  userId: string | null;
  isOwner: boolean;
  isProfessional: boolean;
  isAdmin: boolean;
};

const noAccess: RoleAccess = {
  userId: null,
  isOwner: false,
  isProfessional: false,
  isAdmin: false,
};

export async function getCurrentRoleAccess(): Promise<RoleAccess> {
  if (!isSupabaseConfigured()) return noAccess;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return noAccess;

  const { data: roleRows } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_id", user.id);
  const roles = (roleRows ?? []).map((row) => row.role);

  return {
    userId: user.id,
    isOwner: roles.includes("owner"),
    isProfessional: roles.includes("professional"),
    isAdmin: roles.includes("admin"),
  };
}

export async function requireProfessionalAccess() {
  const access = await getCurrentRoleAccess();
  if (!access.userId) redirect("/login");
  if (!access.isProfessional && !access.isAdmin) redirect("/dashboard");
  return access;
}

export async function requireAdminAccess() {
  const access = await getCurrentRoleAccess();
  if (!access.userId) redirect("/login");
  if (!access.isAdmin) redirect("/dashboard");
  return access;
}
