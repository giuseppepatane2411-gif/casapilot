"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";

import AuthMessage from "@/components/auth/AuthMessage";
import FormField from "@/components/auth/FormField";
import { getAccountErrorMessage } from "@/lib/account/errors";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage({
        tone: "info",
        text: "Il recupero password è temporaneamente non disponibile. Riprova più tardi.",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      if (error) throw error;
      setMessage({
        tone: "success",
        text: "Ti abbiamo inviato le istruzioni per impostare una nuova password.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile inviare l’email."),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}
      <FormField
        label="Email dell’account"
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="nome@email.it"
        autoComplete="email"
        required
        icon={Mail}
      />
      <button
        type="submit"
        disabled={loading}
        className="group inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-lg hover:bg-blue-600 disabled:opacity-60"
      >
        {loading ? "Invio…" : "Invia link di recupero"}
        {!loading && <ArrowRight size={17} />}
      </button>
      <Link
        href="/login"
        className="block text-center text-sm font-bold text-blue-600 hover:underline"
      >
        Torna all’accesso
      </Link>
    </form>
  );
}
