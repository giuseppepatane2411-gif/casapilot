"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  MapPin,
  Phone,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";

import AuthMessage from "@/components/auth/AuthMessage";
import FormField from "@/components/auth/FormField";
import { getProfessionalCompleteness, getProfessionalMissingFields } from "@/lib/account/completeness";
import { PROFESSIONAL_STATUS_COPY, PROFESSIONS } from "@/lib/account/constants";
import { getAccountErrorMessage, normalizeProvince } from "@/lib/account/errors";
import type {
  AccountType,
  ProfessionalProfile,
  ProfessionalVerificationStatus,
} from "@/lib/account/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type PersonalContext = {
  id: string;
  accountType: AccountType;
  fullName: string;
  phone: string;
  city: string;
  province: string;
};

const EMPTY_PROFESSIONAL_PROFILE: ProfessionalProfile = {
  userId: "",
  profession: "",
  businessName: "",
  vatNumber: "",
  registrationNumber: "",
  phone: "",
  city: "",
  province: "",
  websiteUrl: "",
  bio: "",
  serviceAreas: [],
  yearsExperience: null,
  verificationStatus: "draft",
  verificationNotes: "",
  isPublic: false,
  verifiedAt: null,
};

export default function ProfessionalProfilePanel() {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [personal, setPersonal] = useState<PersonalContext | null>(null);
  const [profile, setProfile] = useState<ProfessionalProfile>(EMPTY_PROFESSIONAL_PROFILE);
  const [serviceAreasText, setServiceAreasText] = useState("");
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  const loadProfile = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setPersonal(null);
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, account_type, full_name, phone, city, province")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const accountType: AccountType =
        profileRow?.account_type === "professional" ? "professional" : "private";
      const personalContext: PersonalContext = {
        id: user.id,
        accountType,
        fullName: profileRow?.full_name ?? user.user_metadata?.full_name ?? "",
        phone: profileRow?.phone ?? user.user_metadata?.phone ?? "",
        city: profileRow?.city ?? user.user_metadata?.city ?? "",
        province: profileRow?.province ?? user.user_metadata?.province ?? "",
      };
      setPersonal(personalContext);

      if (accountType !== "professional") {
        setProfile({
          ...EMPTY_PROFESSIONAL_PROFILE,
          userId: user.id,
          phone: personalContext.phone,
          city: personalContext.city,
          province: personalContext.province,
        });
        setServiceAreasText("");
        return;
      }

      const { data: professionalRow, error: professionalError } = await supabase
        .from("professional_profiles")
        .select(
          "user_id, profession, business_name, vat_number, registration_number, phone, city, province, website_url, bio, service_areas, years_experience, verification_status, verification_notes, is_public, verified_at",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (professionalError) throw professionalError;

      const nextProfile: ProfessionalProfile = {
        userId: user.id,
        profession: professionalRow?.profession ?? "",
        businessName: professionalRow?.business_name ?? "",
        vatNumber: professionalRow?.vat_number ?? "",
        registrationNumber: professionalRow?.registration_number ?? "",
        phone: professionalRow?.phone ?? personalContext.phone,
        city: professionalRow?.city ?? personalContext.city,
        province: professionalRow?.province ?? personalContext.province,
        websiteUrl: professionalRow?.website_url ?? "",
        bio: professionalRow?.bio ?? "",
        serviceAreas: Array.isArray(professionalRow?.service_areas)
          ? professionalRow.service_areas.filter((value: unknown): value is string => typeof value === "string")
          : [],
        yearsExperience:
          typeof professionalRow?.years_experience === "number"
            ? professionalRow.years_experience
            : null,
        verificationStatus: isVerificationStatus(professionalRow?.verification_status)
          ? professionalRow.verification_status
          : "draft",
        verificationNotes: professionalRow?.verification_notes ?? "",
        isPublic: Boolean(professionalRow?.is_public),
        verifiedAt: professionalRow?.verified_at ?? null,
      };
      setProfile(nextProfile);
      setServiceAreasText(nextProfile.serviceAreas.join(", "));
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile caricare il profilo professionale."),
      });
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  const normalizedProfile = useMemo(
    () => ({
      ...profile,
      serviceAreas: parseServiceAreas(serviceAreasText),
    }),
    [profile, serviceAreasText],
  );
  const completeness = getProfessionalCompleteness(normalizedProfile);
  const missingFields = getProfessionalMissingFields(normalizedProfile);

  async function activateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!personal || !configured) return;

    if (!profile.profession || !profile.businessName.trim()) {
      setMessage({
        tone: "error",
        text: "Indica professione e denominazione dello studio o dell’attività.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("activate_professional_profile", {
        p_profession: profile.profession,
        p_business_name: profile.businessName.trim(),
        p_phone: profile.phone.trim() || null,
        p_city: profile.city.trim() || null,
        p_province: profile.province || null,
      });
      if (error) throw error;

      setMessage({
        tone: "success",
        text: "Profilo professionale attivato. Ora puoi completare i dati e richiedere la verifica.",
      });
      await loadProfile();
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile attivare il profilo professionale."),
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveProfessionalProfile(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!personal || personal.accountType !== "professional" || !configured) return false;

    setSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("professional_profiles")
        .update({
          profession: normalizedProfile.profession,
          business_name: normalizedProfile.businessName.trim(),
          vat_number: normalizedProfile.vatNumber.trim() || null,
          registration_number: normalizedProfile.registrationNumber.trim() || null,
          phone: normalizedProfile.phone.trim() || null,
          city: normalizedProfile.city.trim() || null,
          province: normalizedProfile.province || null,
          website_url: normalizedProfile.websiteUrl.trim() || null,
          bio: normalizedProfile.bio.trim() || null,
          service_areas: normalizedProfile.serviceAreas,
          years_experience: normalizedProfile.yearsExperience,
          is_public:
            normalizedProfile.verificationStatus === "verified"
              ? normalizedProfile.isPublic
              : false,
        })
        .eq("user_id", personal.id);
      if (error) throw error;

      setMessage({ tone: "success", text: "Profilo professionale aggiornato." });
      await loadProfile();
      return true;
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile salvare il profilo professionale."),
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submitForVerification() {
    if (!personal || !configured) return;

    if (missingFields.length > 0) {
      setMessage({
        tone: "error",
        text: `Prima dell’invio completa: ${missingFields.map((item) => item.label).join(", ")}.`,
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const saved = await saveProfessionalProfile();
      if (!saved) return;

      const supabase = createClient();
      const { error } = await supabase.rpc("submit_professional_verification");
      if (error) throw error;

      setMessage({
        tone: "success",
        text: "Richiesta di verifica inviata. Potrai seguire lo stato da questa pagina.",
      });
      await loadProfile();
    } catch (error) {
      setMessage({
        tone: "error",
        text: getAccountErrorMessage(error, "Non è stato possibile inviare la richiesta di verifica."),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="h-[640px] animate-pulse rounded-[30px] bg-slate-200/70" />;
  }

  if (!configured) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ShieldCheck size={24} className="text-blue-600" />
        <h2 className="mt-4 text-2xl font-bold text-slate-950">Profili professionali temporaneamente non disponibili</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
          Il percorso immobiliare e i dati locali continuano a funzionare normalmente. Riprova più tardi per completare il profilo professionale.
        </p>
      </section>
    );
  }

  if (!personal) {
    return <AuthMessage tone="info">Accedi per gestire il profilo professionale.</AuthMessage>;
  }

  if (personal.accountType === "private") {
    return (
      <div className="space-y-5">
        {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}

        <section className="rounded-[30px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <Briefcase size={22} />
          </span>
          <p className="mt-5 text-sm font-semibold text-blue-300">Un solo account</p>
          <h2 className="mt-1 text-3xl font-bold">Aggiungi la tua attività professionale.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Non devi creare un secondo account. Le pratiche personali restano disponibili e si aggiunge uno spazio dedicato alla tua attività.
          </p>
        </section>

        <form onSubmit={activateProfile} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-xl font-bold text-slate-950">Dati iniziali dell’attività</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Questi dati attivano il profilo. La verifica delle abilitazioni avverrà soltanto dopo una richiesta esplicita.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Professione <span className="text-blue-600">*</span></span>
              <select
                value={profile.profession}
                onChange={(event) => setProfile({ ...profile, profession: event.target.value })}
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Seleziona</option>
                {PROFESSIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <FormField
              label="Studio o attività"
              name="businessName"
              value={profile.businessName}
              onChange={(value) => setProfile({ ...profile, businessName: value })}
              required
              icon={Building2}
            />
            <FormField
              label="Telefono"
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={(value) => setProfile({ ...profile, phone: value })}
              icon={Phone}
            />
            <FormField
              label="Comune"
              name="city"
              value={profile.city}
              onChange={(value) => setProfile({ ...profile, city: value })}
              icon={MapPin}
            />
            <FormField
              label="Provincia"
              name="province"
              value={profile.province}
              onChange={(value) => setProfile({ ...profile, province: normalizeProvince(value) })}
              icon={MapPin}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-60 sm:w-auto"
          >
            <Briefcase size={17} />
            {saving ? "Attivazione…" : "Attiva il profilo professionale"}
          </button>
        </form>
      </div>
    );
  }

  const canSubmit =
    normalizedProfile.verificationStatus === "draft" ||
    normalizedProfile.verificationStatus === "changes_requested";

  return (
    <div className="space-y-5">
      {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 bg-slate-950 p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-300">Profilo professionale</p>
            <h2 className="mt-1 text-3xl font-bold">{profile.businessName || personal.fullName}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Completa la scheda, controlla ciò che sarà visibile e invia la richiesta quando tutti i dati sono corretti.
            </p>
          </div>
          <div className="min-w-48 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Completezza</span>
              <span>{completeness}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <StatusCard status={normalizedProfile.verificationStatus} notes={normalizedProfile.verificationNotes} />

          <form onSubmit={saveProfessionalProfile} className="mt-7 space-y-7">
            <section>
              <h3 className="text-lg font-bold text-slate-950">Attività e abilitazione</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Professione</span>
                  <select
                    value={profile.profession}
                    onChange={(event) => setProfile({ ...profile, profession: event.target.value })}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Seleziona</option>
                    {PROFESSIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <FormField label="Studio o attività" name="businessName" value={profile.businessName} onChange={(value) => setProfile({ ...profile, businessName: value })} icon={Building2} />
                <FormField label="Partita IVA" name="vatNumber" value={profile.vatNumber} onChange={(value) => setProfile({ ...profile, vatNumber: value })} />
                <FormField label="N. albo o abilitazione" name="registrationNumber" value={profile.registrationNumber} onChange={(value) => setProfile({ ...profile, registrationNumber: value })} />
                <FormField label="Anni di esperienza" name="yearsExperience" type="number" value={profile.yearsExperience?.toString() ?? ""} onChange={(value) => setProfile({ ...profile, yearsExperience: value ? Math.max(0, Math.min(80, Number(value))) : null })} />
                <FormField label="Sito web" name="websiteUrl" type="url" value={profile.websiteUrl} onChange={(value) => setProfile({ ...profile, websiteUrl: value })} icon={Globe2} />
              </div>
            </section>

            <section className="border-t border-slate-100 pt-7">
              <h3 className="text-lg font-bold text-slate-950">Contatti e territorio</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <FormField label="Telefono professionale" name="phone" type="tel" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} icon={Phone} />
                <FormField label="Comune" name="city" value={profile.city} onChange={(value) => setProfile({ ...profile, city: value })} icon={MapPin} />
                <FormField label="Provincia" name="province" value={profile.province} onChange={(value) => setProfile({ ...profile, province: normalizeProvince(value) })} icon={MapPin} />
                <div className="sm:col-span-2">
                  <FormField
                    label="Zone servite"
                    name="serviceAreas"
                    value={serviceAreasText}
                    onChange={setServiceAreasText}
                    placeholder="Catania, Acireale, Provincia di Catania"
                    hint="Separa le zone con una virgola."
                    icon={MapPin}
                  />
                </div>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-7">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Presentazione professionale</span>
                <textarea
                  value={profile.bio}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  rows={6}
                  maxLength={1600}
                  placeholder="Descrivi esperienza, specializzazioni e tipo di supporto offerto agli utenti."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <span className={`mt-1.5 block text-xs ${profile.bio.trim().length >= 80 ? "text-emerald-600" : "text-slate-400"}`}>
                  {profile.bio.trim().length}/1600 caratteri · minimo consigliato per la verifica: 80
                </span>
              </label>
            </section>

            {normalizedProfile.verificationStatus === "verified" && (
              <label className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                <input
                  type="checkbox"
                  checked={profile.isPublic}
                  onChange={(event) => setProfile({ ...profile, isPublic: event.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600"
                />
                <span>
                  Rendi visibile il profilo nella rete Guimmia. Puoi disattivare la visibilità in qualsiasi momento.
                </span>
              </label>
            )}

            {(normalizedProfile.verificationStatus === "submitted" ||
              normalizedProfile.verificationStatus === "under_review" ||
              normalizedProfile.verificationStatus === "verified") && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Modificare dati essenziali può richiedere una nuova verifica e sospendere temporaneamente la visibilità pubblica.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={saving || submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Salvataggio…" : "Salva profilo"}
              </button>
              {canSubmit && (
                <button
                  type="button"
                  onClick={() => void submitForVerification()}
                  disabled={saving || submitting || missingFields.length > 0}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={17} />
                  {submitting ? "Invio…" : "Invia per la verifica"}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {missingFields.length > 0 && canSubmit && (
        <section className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-bold text-amber-950">
            <Clock3 size={18} />
            Prima dell’invio
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {missingFields.map((field) => (
              <p key={field.id} className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {field.label}
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[26px] border border-blue-200 bg-blue-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <h3 className="font-bold text-blue-950">La verifica non è automatica</h3>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              Registrarsi come professionista non assegna il badge. Lo stato viene modificato soltanto dopo i controlli previsti sulla documentazione e sulle abilitazioni dichiarate.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  status,
  notes,
}: {
  status: ProfessionalVerificationStatus;
  notes: string;
}) {
  const copy = PROFESSIONAL_STATUS_COPY[status];
  const styles = {
    slate: "border-slate-200 bg-slate-50 text-slate-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[copy.tone];

  const Icon = status === "verified" ? BadgeCheck : status === "under_review" ? Clock3 : status === "changes_requested" || status === "suspended" ? AlertTriangle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 shrink-0" />
        <div>
          <h3 className="font-bold">{copy.label}</h3>
          <p className="mt-1 text-sm leading-6 opacity-90">{copy.description}</p>
          {notes && <p className="mt-2 rounded-xl bg-white/60 p-3 text-sm leading-6"><strong>Nota:</strong> {notes}</p>}
        </div>
      </div>
    </div>
  );
}

function parseServiceAreas(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

function isVerificationStatus(value: unknown): value is ProfessionalVerificationStatus {
  return [
    "draft",
    "submitted",
    "under_review",
    "changes_requested",
    "verified",
    "suspended",
  ].includes(String(value));
}
