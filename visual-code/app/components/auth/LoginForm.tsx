"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

import AuthMessage from "@/components/auth/AuthMessage";
import FormField from "@/components/auth/FormField";
import { getAccountErrorMessage } from "@/lib/account/errors";
import {
  buildAuthPath,
  resolveAuthNextPath,
  type AuthAccountType,
} from "@/lib/navigation/auth-flow";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  const nextPath = useMemo(
    () => resolveAuthNextPath({
      next: searchParams.get("next"),
      goal: searchParams.get("goal"),
      message: searchParams.get("message"),
      intent: searchParams.get("intent"),
      brand: searchParams.get("brand"),
    }),
    [searchParams],
  );
  const registrationType: AuthAccountType =
    searchParams.get("type") === "professional" ||
    nextPath.startsWith("/professionista") ||
    nextPath.startsWith("/dashboard/professional")
      ? "professional"
      : "private";
  const registerHref = buildAuthPath("/register", {
    accountType: registrationType,
    next: nextPath,
  });
  const checkEmailHref = buildAuthPath("/check-email", { next: nextPath });

  const callbackMessage = (() => {
    const error = searchParams.get("error");
    if (error === "confirmation") {
      return {
        tone: "error" as const,
        text: "Il collegamento di conferma non è valido o è scaduto. Puoi richiedere una nuova email.",
      };
    }
    if (error === "configuration") {
      return {
        tone: "info" as const,
        text: "L’accesso è temporaneamente non disponibile. Riprova più tardi.",
      };
    }
    return null;
  })();
  const visibleMessage = message ?? callbackMessage;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage({
        tone: "info",
        text: "L’accesso è temporaneamente non disponibile. Riprova più tardi.",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Email o password non corretti."),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {visibleMessage && (
        <AuthMessage tone={visibleMessage.tone}>{visibleMessage.text}</AuthMessage>
      )}

      <FormField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="nome@email.it"
        autoComplete="email"
        required
        icon={Mail}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="La tua password"
        autoComplete="current-password"
        required
        icon={LockKeyhole}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/forgot-password"
          className="font-semibold text-blue-600 hover:underline"
        >
          Password dimenticata?
        </Link>
        {searchParams.get("error") === "confirmation" && (
          <Link href={checkEmailHref} className="font-semibold text-blue-600 hover:underline">
            Reinvia conferma
          </Link>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Accesso…" : "Accedi a Guimmia"}
        {!loading && (
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
        )}
      </button>

      <p className="text-center text-sm text-slate-500">
        Non hai ancora un account?{" "}
        <Link href={registerHref} className="font-bold text-blue-600 hover:underline">
          Registrati gratuitamente
        </Link>
      </p>
    </form>
  );
}
