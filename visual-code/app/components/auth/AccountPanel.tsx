"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import AuthMessage from "@/components/auth/AuthMessage";
import FormField from "@/components/auth/FormField";
import { getAccountErrorMessage, normalizeProvince } from "@/lib/account/errors";
import type { AccountProfile } from "@/lib/account/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AccountSnapshot = AccountProfile & {
  emailConfirmed: boolean;
};

export default function AccountPanel() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!configured) return;

    let active = true;

    async function loadAccount() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          if (active) setAccount(null);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, account_type, phone, city, province, marketing_consent")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!active) return;

        setAccount({
          id: user.id,
          email: user.email ?? "",
          emailConfirmed: Boolean(user.email_confirmed_at),
          fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
          accountType:
            profile?.account_type === "professional" ||
            user.user_metadata?.account_type === "professional"
              ? "professional"
              : "private",
          phone: profile?.phone ?? user.user_metadata?.phone ?? "",
          city: profile?.city ?? user.user_metadata?.city ?? "",
          province: profile?.province ?? user.user_metadata?.province ?? "",
          marketingConsent: Boolean(profile?.marketing_consent),
        });
      } catch (error) {
        if (active) {
          setMessage({
            tone: "error",
            text: getAccountErrorMessage(error, "Non è stato possibile caricare il profilo."),
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAccount();
    return () => {
      active = false;
    };
  }, [configured]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !configured) return;

    if (!account.fullName.trim() || !account.city.trim() || account.province.length !== 2) {
      setMessage({
        tone: "error",
        text: "Completa nome, Comune e sigla della Provincia.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: account.fullName.trim(),
          phone: account.phone.trim() || null,
          city: account.city.trim(),
          province: account.province,
          marketing_consent: account.marketingConsent,
          marketing_consent_updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      if (error) throw error;
      setMessage({ tone: "success", text: "Profilo aggiornato correttamente." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile salvare il profilo."),
      });
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-[520px] animate-pulse rounded-[28px] bg-slate-200/70" />;
  }

  if (!configured) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <ShieldCheck size={22} />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-slate-950">Account temporaneamente non disponibile</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Puoi continuare a lavorare sulle pratiche salvate in questo dispositivo. L’accesso all’account tornerà disponibile appena il servizio sarà collegato.
        </p>
        <Link href="/dashboard" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-600">
          Torna al percorso
        </Link>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-slate-950">Accedi al tuo account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Accedi per gestire dati personali, sicurezza e profilo professionale.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-600">
            Accedi
          </Link>
          <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Crea un account
          </Link>
        </div>
      </section>
    );
  }

  const professional = account.accountType === "professional";

  return (
    <div className="space-y-5">
      {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                {professional ? <Briefcase size={24} /> : <User size={24} />}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-300">
                  {professional ? "Account professionale" : "Account privato"}
                </p>
                <h2 className="mt-1 text-2xl font-bold">{account.fullName || "Il tuo profilo"}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15"
            >
              <LogOut size={16} />
              Esci
            </button>
          </div>
        </div>

        <form onSubmit={saveProfile} className="p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                label="Nome e cognome"
                name="fullName"
                value={account.fullName}
                onChange={(value) => setAccount({ ...account, fullName: value })}
                autoComplete="name"
                required
                icon={User}
              />
            </div>
            <FormField
              label="Email"
              name="email"
              type="email"
              value={account.email}
              onChange={() => undefined}
              autoComplete="email"
              icon={Mail}
              hint={account.emailConfirmed ? "Email verificata." : "Email in attesa di conferma."}
              disabled
            />
            <FormField
              label="Telefono"
              name="phone"
              type="tel"
              value={account.phone}
              onChange={(value) => setAccount({ ...account, phone: value })}
              autoComplete="tel"
              icon={Phone}
            />
            <FormField
              label="Comune"
              name="city"
              value={account.city}
              onChange={(value) => setAccount({ ...account, city: value })}
              autoComplete="address-level2"
              required
              icon={MapPin}
            />
            <FormField
              label="Provincia"
              name="province"
              value={account.province}
              onChange={(value) => setAccount({ ...account, province: normalizeProvince(value) })}
              autoComplete="address-level1"
              required
              icon={MapPin}
            />
          </div>

          <label className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <input
              type="checkbox"
              checked={account.marketingConsent}
              onChange={(event) => setAccount({ ...account, marketingConsent: event.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span>Desidero ricevere aggiornamenti utili sul prodotto. Il consenso è facoltativo.</span>
          </label>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Salvataggio…" : "Salva modifiche"}
            </button>
          </div>
        </form>
      </section>

      <section className={`grid gap-4 ${professional ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        <Link
          href="/forgot-password"
          className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600">
            <KeyRound size={20} />
          </span>
          <h3 className="mt-4 font-bold text-slate-950">Password e sicurezza</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Richiedi un collegamento sicuro per impostare una nuova password.</p>
        </Link>

        {professional ? (
          <Link
            href="/professionista/profilo"
            className="group rounded-[24px] border border-blue-200 bg-blue-50 p-5 shadow-sm transition hover:-translate-y-0.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <BadgeCheck size={20} />
            </span>
            <h3 className="mt-4 font-bold text-slate-950">
              Gestisci il profilo professionale
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Completa attività, zone servite e stato della verifica.
            </p>
          </Link>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" />
          <div>
            <h3 className="font-bold text-emerald-950">Dati dell’account separati dalle pratiche</h3>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              L’account identifica l’utente. In questa configurazione, immobili e documenti continuano a essere conservati sul dispositivo utilizzato.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
