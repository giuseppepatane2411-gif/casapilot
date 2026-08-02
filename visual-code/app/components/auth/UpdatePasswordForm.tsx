"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

import AuthMessage from "@/components/auth/AuthMessage";
import FormField from "@/components/auth/FormField";
import { getAccountErrorMessage, isStrongEnoughPassword } from "@/lib/account/errors";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isStrongEnoughPassword(password)) {
      setMessage({ tone: "error", text: "Usa almeno 10 caratteri, una maiuscola, una minuscola e un numero." });
      return;
    }
    if (password !== confirmation) {
      setMessage({ tone: "error", text: "Le due password non coincidono." });
      return;
    }
    if (!isSupabaseConfigured()) {
      setMessage({ tone: "info", text: "Il cambio password è temporaneamente non disponibile. Riprova più tardi." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ tone: "success", text: "Password aggiornata correttamente." });
      window.setTimeout(() => {
        router.push("/dashboard/account");
        router.refresh();
      }, 900);
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile aggiornare la password."),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}
      <FormField
        label="Nuova password"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Crea una password sicura"
        autoComplete="new-password"
        required
        icon={LockKeyhole}
      />
      <FormField
        label="Conferma password"
        name="confirmation"
        type="password"
        value={confirmation}
        onChange={setConfirmation}
        placeholder="Ripeti la password"
        autoComplete="new-password"
        required
        icon={LockKeyhole}
      />
      <button
        type="submit"
        disabled={loading}
        className="group inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-lg hover:bg-blue-600 disabled:opacity-60"
      >
        {loading ? "Aggiornamento…" : "Salva nuova password"}
        {!loading && <ArrowRight size={17} />}
      </button>
    </form>
  );
}
