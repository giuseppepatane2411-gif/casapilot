"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";

import AuthMessage from "@/components/auth/AuthMessage";
import FormField from "@/components/auth/FormField";
import { getAccountErrorMessage } from "@/lib/account/errors";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function CheckEmailPanel() {
  const [email, setEmail] = useState("");
  const [nextPath, setNextPath] = useState("/dashboard");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedEmail = window.sessionStorage.getItem("casapilot-pending-email") ?? "";
      const storedNext = window.sessionStorage.getItem("casapilot-pending-next") ?? "/dashboard";
      setEmail(storedEmail);
      setNextPath(
        storedNext.startsWith("/") && !storedNext.startsWith("//")
          ? storedNext
          : "/dashboard",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function resend() {
    setMessage(null);
    if (!email.trim()) {
      setMessage({ tone: "error", text: "Inserisci l’email usata durante la registrazione." });
      return;
    }

    if (!isSupabaseConfigured()) {
      setMessage({
        tone: "info",
        text: "Il servizio email è temporaneamente non disponibile. Riprova più tardi.",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo },
      });
      if (error) throw error;

      setCooldown(45);
      setMessage({
        tone: "success",
        text: "Email inviata di nuovo. Controlla anche le cartelle Spam e Promozioni.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile inviare nuovamente l’email."),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Mail size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-800">Ultimo passaggio</p>
            <h2 className="mt-1 text-2xl font-bold text-emerald-950">Conferma il tuo indirizzo email</h2>
            <p className="mt-2 text-sm leading-7 text-emerald-800">
              Abbiamo inviato un collegamento di conferma. Aprilo dallo stesso browser oppure accedi dopo aver completato la verifica.
            </p>
          </div>
        </div>
      </section>

      {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}

      <div>
        <FormField
          label="Email di registrazione"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="nome@email.it"
          autoComplete="email"
          required
          icon={Mail}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p className="flex items-start gap-2">
          <CheckCircle2 size={17} className="mt-1 shrink-0 text-blue-600" />
          Il collegamento serve a proteggere il tuo account e impedire registrazioni con indirizzi non autorizzati.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void resend()}
        disabled={loading || cooldown > 0}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
        {loading
          ? "Invio in corso…"
          : cooldown > 0
            ? `Puoi reinviare tra ${cooldown}s`
            : "Invia di nuovo l’email"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Hai già confermato?{" "}
        <Link href="/login" className="font-bold text-blue-600 hover:underline">
          Accedi al tuo account
        </Link>
      </p>
    </div>
  );
}
