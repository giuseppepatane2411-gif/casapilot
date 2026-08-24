"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import AuthMessage from "@/components/auth/AuthMessage";
import FormField from "@/components/auth/FormField";
import {
  ACCOUNT_PRIVACY_VERSION,
  ACCOUNT_TERMS_VERSION,
} from "@/lib/account/constants";
import {
  getAccountErrorMessage,
  isStrongEnoughPassword,
  normalizeProvince,
} from "@/lib/account/errors";
import type { AccountType } from "@/lib/account/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ProfessionalType = "individual" | "organization";

function safeNextPath(
  value: string | null,
  goal: string | null,
  accountType: AccountType,
) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  if (accountType === "professional") return "/professionista/onboarding";
  if (goal === "sale" || goal === "rent") {
    return `/dashboard/properties/new?goal=${goal}`;
  }
  return "/dashboard";
}

export default function RegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType: AccountType =
    searchParams.get("type") === "professional" ? "professional" : "private";

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [professionalType, setProfessionalType] = useState<ProfessionalType>("individual");
  const [legalName, setLegalName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next"), searchParams.get("goal"), accountType),
    [searchParams, accountType],
  );

  const steps =
    accountType === "professional"
      ? ["Dati personali", "Attività", "Accesso"]
      : ["Dati personali", "Accesso"];
  const finalStep = steps.length - 1;

  function selectAccountType(type: AccountType) {
    setAccountType(type);
    setStep(0);
    setMessage(null);
  }

  function validateCurrentStep() {
    setMessage(null);

    if (step === 0) {
      if (!fullName.trim() || !email.trim() || !city.trim() || province.length !== 2) {
        setMessage({
          tone: "error",
          text: "Completa nome, email, Comune e sigla della Provincia.",
        });
        return false;
      }
      if (accountType === "professional" && !phone.trim()) {
        setMessage({ tone: "error", text: "Per il profilo professionale indica anche il telefono." });
        return false;
      }
    }

    if (accountType === "professional" && step === 1) {
      const legalRequired = professionalType === "organization";
      if ((legalRequired && !legalName.trim()) || !businessName.trim()) {
        setMessage({
          tone: "error",
          text: legalRequired
            ? "Indica ragione sociale e nome dell’attività."
            : "Indica il nome professionale o dell’attività.",
        });
        return false;
      }
    }

    return true;
  }

  function continueRegistration() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(current + 1, finalStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (step !== finalStep) {
      continueRegistration();
      return;
    }

    if (!isStrongEnoughPassword(password)) {
      setMessage({
        tone: "error",
        text: "Usa almeno 10 caratteri, includendo una maiuscola, una minuscola e un numero.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ tone: "error", text: "Le due password non coincidono." });
      return;
    }
    if (!accepted) {
      setMessage({
        tone: "error",
        text: "Per creare l’account devi accettare le condizioni d’uso e l’informativa privacy.",
      });
      return;
    }
    if (!isSupabaseConfigured()) {
      setMessage({ tone: "info", text: "Le registrazioni sono temporaneamente non disponibili." });
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const normalizedEmail = email.trim().toLowerCase();
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const resolvedLegalName =
        accountType === "professional"
          ? (legalName.trim() || fullName.trim())
          : null;
      const resolvedBusinessName =
        accountType === "professional"
          ? (businessName.trim() || resolvedLegalName || fullName.trim())
          : null;

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            account_type: accountType,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            city: city.trim(),
            province,
            professional_type: accountType === "professional" ? professionalType : null,
            legal_name: resolvedLegalName,
            display_name: resolvedBusinessName,
            business_name: resolvedBusinessName,
            contact_name: accountType === "professional" ? fullName.trim() : null,
            vat_number: accountType === "professional" ? vatNumber.trim() || null : null,
            service_areas: [],
            terms_accepted_at: now,
            terms_version: ACCOUNT_TERMS_VERSION,
            privacy_accepted_at: now,
            privacy_version: ACCOUNT_PRIVACY_VERSION,
            marketing_consent: marketingConsent,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      window.sessionStorage.setItem("casapilot-pending-email", normalizedEmail);
      window.sessionStorage.setItem("casapilot-pending-next", nextPath);
      router.push("/check-email");
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile creare l’account. Controlla i dati e riprova."),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <RegistrationProgress steps={steps} currentStep={step} />
      {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}

      {step === 0 && (
        <div className="space-y-6">
          <section>
            <p className="text-sm font-bold text-slate-950">Come userai Guimmia?</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Proprietari e professionisti hanno percorsi separati.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AccountTypeCard
                active={accountType === "private"}
                icon={User}
                title="Privato"
                description="Per gestire immobili, richieste e documenti."
                onClick={() => selectAccountType("private")}
              />
              <AccountTypeCard
                active={accountType === "professional"}
                icon={Briefcase}
                title="Professionista"
                description="Per creare il profilo professionale e ricevere richieste pertinenti."
                onClick={() => selectAccountType("professional")}
              />
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField label="Nome e cognome" name="fullName" value={fullName} onChange={setFullName} placeholder="Mario Rossi" autoComplete="name" required icon={User} />
            </div>
            <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} placeholder="nome@email.it" autoComplete="email" required icon={Mail} />
            <FormField label={accountType === "professional" ? "Telefono" : "Telefono facoltativo"} name="phone" type="tel" value={phone} onChange={setPhone} placeholder="+39 333 000 0000" autoComplete="tel" required={accountType === "professional"} icon={Phone} />
            <FormField label="Comune" name="city" value={city} onChange={setCity} placeholder="Comune di residenza o attività" autoComplete="address-level2" required icon={MapPin} />
            <FormField label="Provincia" name="province" value={province} onChange={(value) => setProvince(normalizeProvince(value))} placeholder="CT" autoComplete="address-level1" required icon={MapPin} hint="Sigla di due lettere." />
          </section>
        </div>
      )}

      {accountType === "professional" && step === 1 && (
        <div className="space-y-6">
          <section className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <h3 className="font-bold text-slate-950">Identità dell’attività</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Questi dati vengono salvati una volta e saranno già precompilati nell’onboarding.
            </p>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setProfessionalType("individual")} className={`rounded-2xl border p-4 text-left ${professionalType === "individual" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white"}`}>
              <span className="font-bold text-slate-950">Libero professionista / ditta individuale</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">Operi personalmente con la tua attività.</span>
            </button>
            <button type="button" onClick={() => setProfessionalType("organization")} className={`rounded-2xl border p-4 text-left ${professionalType === "organization" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white"}`}>
              <span className="font-bold text-slate-950">Studio, società o impresa</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">Rappresenti un’organizzazione professionale.</span>
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {professionalType === "organization" && (
              <div className="sm:col-span-2">
                <FormField label="Ragione sociale" name="legalName" value={legalName} onChange={setLegalName} placeholder="Rossi Servizi Immobiliari S.r.l." required icon={Building2} />
              </div>
            )}
            <div className="sm:col-span-2">
              <FormField label={professionalType === "organization" ? "Nome dell’attività / nome commerciale" : "Nome professionale o dell’attività"} name="businessName" value={businessName} onChange={setBusinessName} placeholder="Rossi Casa" required icon={Building2} />
            </div>
            <FormField label="Partita IVA" name="vatNumber" value={vatNumber} onChange={setVatNumber} placeholder="Puoi completarla anche nell’onboarding" />
          </div>
        </div>
      )}

      {step === finalStep && (
        <div className="space-y-6">
          <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><ShieldCheck size={20} /></span>
              <div>
                <h3 className="font-bold text-slate-950">Proteggi il tuo account</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Per i professionisti l’onboarding si apre solo dopo una sessione Supabase valida. Con la conferma email attiva, il link email è quindi obbligatorio.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Password" name="password" type="password" value={password} onChange={setPassword} placeholder="Crea una password sicura" autoComplete="new-password" required icon={LockKeyhole} hint="Almeno 10 caratteri, una maiuscola, una minuscola e un numero." />
            <FormField label="Ripeti la password" name="confirmPassword" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Ripeti la password" autoComplete="new-password" required icon={LockKeyhole} />
          </div>
          <PasswordChecklist password={password} />

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
            <span>Accetto le <Link href="/terms" target="_blank" className="font-bold text-blue-600 hover:underline">condizioni d’uso</Link> e dichiaro di aver letto l’<Link href="/privacy" target="_blank" className="font-bold text-blue-600 hover:underline">informativa privacy</Link>.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
            <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
            <span>Desidero ricevere aggiornamenti utili su Guimmia. Il consenso è facoltativo e revocabile.</span>
          </label>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => { setMessage(null); setStep((current) => Math.max(0, current - 1)); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} />Indietro</button>
        ) : <span />}
        {step < finalStep ? (
          <button type="button" onClick={continueRegistration} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-600">Continua<ArrowRight size={17} /></button>
        ) : (
          <button type="submit" disabled={loading} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Creazione account…" : "Crea il mio account"}{!loading && <ArrowRight size={17} />}</button>
        )}
      </div>

      <p className="text-center text-sm text-slate-500">Hai già un account? <Link href="/login" className="font-bold text-blue-600 hover:underline">Accedi</Link></p>
    </form>
  );
}

function RegistrationProgress({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><span>Creazione account</span><span>{currentStep + 1} di {steps.length}</span></div>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((label, index) => (
          <div key={label}><div className={`h-1.5 rounded-full ${index <= currentStep ? "bg-blue-600" : "bg-slate-200"}`} /><p className={`mt-2 text-[11px] font-bold ${index === currentStep ? "text-slate-950" : "text-slate-400"}`}>{label}</p></div>
        ))}
      </div>
    </div>
  );
}

function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "10 caratteri", passed: password.length >= 10 },
    { label: "Una maiuscola", passed: /[A-Z]/.test(password) },
    { label: "Una minuscola", passed: /[a-z]/.test(password) },
    { label: "Un numero", passed: /\d/.test(password) },
  ];
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
      {checks.map((check) => (
        <p key={check.label} className={`flex items-center gap-2 text-xs font-semibold ${check.passed ? "text-emerald-700" : "text-slate-400"}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full ${check.passed ? "bg-emerald-100" : "bg-slate-100"}`}><Check size={12} /></span>{check.label}</p>
      ))}
    </div>
  );
}

function AccountTypeCard({ active, icon: Icon, title, description, onClick }: { active: boolean; icon: typeof User; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`relative rounded-[22px] border p-4 text-left transition ${active ? "border-blue-500 bg-blue-50 shadow-sm ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
      {active && <CheckCircle2 size={18} className="absolute right-3 top-3 text-blue-600" />}
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}><Icon size={18} /></span>
      <span className="mt-4 block font-bold text-slate-950">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
    </button>
  );
}
