"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Save,
  Sparkles,
} from "lucide-react";

import ItalianAddressAutocomplete, { type LocationSelection } from "./ItalianAddressAutocomplete";
import { createClient } from "@/lib/supabase/client";

type Macro = { id: string; slug: string; label: string; description: string | null; sort_order: number };
type Service = { id: string; macro_category_id: string; slug: string; label: string; description: string | null; regulatory_class: string; sort_order: number };

type ProfessionalProfile = {
  professional_type: "individual" | "organization";
  display_name: string;
  legal_name: string | null;
  business_name: string;
  vat_number: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  bio: string;
  service_areas: string[];
  years_experience: number | null;
  street_address: string | null;
  postal_code: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  verification_status: string;
};

const STEP_LABELS = ["Identità", "Sede", "Presentazione", "Categorie", "Zone operative", "Revisione"];

export default function ProfessionalOnboardingCloud() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [professionalType, setProfessionalType] = useState<"individual" | "organization">("individual");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [phone, setPhone] = useState("");

  const [addressQuery, setAddressQuery] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [region, setRegion] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [years, setYears] = useState(0);
  const [activityNotes, setActivityNotes] = useState("");
  const [bio, setBio] = useState("");

  const [macros, setMacros] = useState<Macro[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);

  const [areaQuery, setAreaQuery] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState("draft");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage(null);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      router.replace("/login?next=/professionista/onboarding");
      return;
    }

    const [profileResult, baseResult, macroResult, serviceResult, selectedResult] = await Promise.all([
      supabase.from("professional_profiles").select("professional_type,display_name,legal_name,business_name,vat_number,phone,city,province,bio,service_areas,years_experience,street_address,postal_code,region,latitude,longitude,onboarding_step,onboarding_completed_at,verification_status").eq("user_id", user.id).single(),
      supabase.from("profiles").select("full_name,phone,city,province").eq("id", user.id).single(),
      supabase.from("marketplace_macro_categories").select("id,slug,label,description,sort_order").eq("active", true).order("sort_order"),
      supabase.from("marketplace_services").select("id,macro_category_id,slug,label,description,regulatory_class,sort_order").eq("active", true).neq("regulatory_class", "excluded_initially").order("sort_order"),
      supabase.from("marketplace_professional_services").select("service_id").eq("professional_user_id", user.id).eq("active", true),
    ]);

    if (profileResult.error || !profileResult.data) {
      setMessage("Profilo professionale non trovato. Completa prima la registrazione professionista.");
      setLoading(false);
      return;
    }

    const p = profileResult.data as ProfessionalProfile;
    setEmail(user.email ?? "");
    setFullName(baseResult.data?.full_name ?? user.user_metadata?.full_name ?? "");
    setProfessionalType(p.professional_type);
    setDisplayName(p.display_name ?? p.business_name ?? "");
    setLegalName(p.legal_name ?? "");
    setVatNumber(p.vat_number ?? "");
    setPhone(p.phone ?? baseResult.data?.phone ?? "");
    setStreetAddress(p.street_address ?? "");
    setAddressQuery(p.street_address ?? "");
    setPostalCode(p.postal_code ?? "");
    setCity(p.city ?? baseResult.data?.city ?? "");
    setProvince(p.province ?? baseResult.data?.province ?? "");
    setRegion(p.region ?? "");
    setLatitude(p.latitude ?? null);
    setLongitude(p.longitude ?? null);
    setYears(p.years_experience ?? 0);
    setBio(p.bio ?? "");
    setServiceAreas(Array.isArray(p.service_areas) ? p.service_areas : []);
    setVerificationStatus(p.verification_status ?? "draft");
    setStep(Math.min(Math.max(p.onboarding_step ?? 0, 0), STEP_LABELS.length - 1));
    setMacros((macroResult.data ?? []) as Macro[]);
    setServices((serviceResult.data ?? []) as Service[]);
    setSelectedServices((selectedResult.data ?? []).map((row) => row.service_id));
    setSelectedMacro((macroResult.data?.[0]?.id as string | undefined) ?? null);
    setLoading(false);
  }

  const visibleServices = services.filter((service) => service.macro_category_id === selectedMacro);
  const selectedLabels = services.filter((service) => selectedServices.includes(service.id)).map((service) => service.label);

  async function saveProfile(nextStep = step) {
    setSaving(true);
    setMessage(null);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      setSaving(false);
      router.replace("/login?next=/professionista/onboarding");
      return false;
    }

    const primaryProfession = selectedLabels[0] ?? "Professionista CasaPilot";
    const { error: profileError } = await supabase
      .from("professional_profiles")
      .update({
        professional_type: professionalType,
        display_name: displayName.trim(),
        legal_name: legalName.trim() || null,
        business_name: displayName.trim(),
        vat_number: vatNumber.trim() || null,
        phone: phone.trim() || null,
        profession: primaryProfession,
        street_address: streetAddress.trim() || null,
        postal_code: postalCode.trim() || null,
        city: city.trim() || null,
        province: province.trim().toUpperCase() || null,
        region: region.trim() || null,
        latitude,
        longitude,
        years_experience: years,
        bio: bio.trim(),
        service_areas: serviceAreas,
        onboarding_step: nextStep,
      })
      .eq("user_id", user.id);

    if (profileError) {
      setMessage(profileError.message);
      setSaving(false);
      return false;
    }

    await supabase.from("profiles").update({ phone: phone.trim() || null, city: city.trim() || null, province: province.trim().toUpperCase() || null }).eq("id", user.id);

    const { error: serviceError } = await supabase.rpc("replace_professional_marketplace_services", {
      p_service_ids: selectedServices,
    });
    if (serviceError) {
      setMessage(serviceError.message);
      setSaving(false);
      return false;
    }

    setSaving(false);
    return true;
  }

  async function goNext() {
    setMessage(null);
    if (step === 0 && !displayName.trim()) {
      setMessage("Indica il nome professionale o dell’attività.");
      return;
    }
    if (step === 1 && (!streetAddress.trim() || !city.trim() || province.trim().length < 2)) {
      setMessage("Seleziona un indirizzo dai suggerimenti per salvare correttamente sede, Comune e Provincia.");
      return;
    }
    if (step === 2 && bio.trim().length < 80) {
      setMessage("Completa una descrizione di almeno 80 caratteri. Puoi usare “Migliora con Pilot”.");
      return;
    }
    if (step === 3 && selectedServices.length === 0) {
      setMessage("Seleziona almeno un servizio dalle macro-categorie CasaPilot.");
      return;
    }
    if (step === 4 && serviceAreas.length === 0) {
      setMessage("Aggiungi almeno una zona operativa.");
      return;
    }

    const next = Math.min(step + 1, STEP_LABELS.length - 1);
    if (await saveProfile(next)) setStep(next);
  }

  async function goBack() {
    const previous = Math.max(step - 1, 0);
    await saveProfile(previous);
    setStep(previous);
  }

  function selectAddress(selection: LocationSelection) {
    setStreetAddress(selection.address || selection.primary);
    setAddressQuery(selection.address || selection.primary);
    setPostalCode(selection.postalCode);
    setCity(selection.city);
    setProvince(selection.province);
    setLatitude(selection.latitude);
    setLongitude(selection.longitude);
  }

  function addArea(selection: LocationSelection) {
    const label = [selection.city || selection.primary, selection.province].filter(Boolean).join(" · ");
    if (label && !serviceAreas.includes(label)) setServiceAreas((current) => [...current, label]);
    setAreaQuery("");
  }

  function toggleService(id: string) {
    setSelectedServices((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function improveBio() {
    if (activityNotes.trim().length < 12) {
      setMessage("Scrivi prima qualche informazione sulla tua attività.");
      return;
    }
    setGenerating(true);
    setMessage(null);
    setNotice(null);
    try {
      const response = await fetch("/api/pilot/professional-bio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: activityNotes, displayName, legalName, serviceLabels: selectedLabels, yearsExperience: years }),
      });
      const payload = (await response.json()) as { text?: string; notice?: string; error?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error || "generation_failed");
      setBio(payload.text);
      setNotice(payload.notice ?? "Bozza creata con Pilot. Controllala e modificala prima di salvarla.");
    } catch {
      setMessage("Pilot non è riuscito a preparare la descrizione. Puoi continuare a scriverla manualmente.");
    } finally {
      setGenerating(false);
    }
  }

  async function finish(submitForVerification: boolean) {
    setMessage(null);
    const ok = await saveProfile(STEP_LABELS.length - 1);
    if (!ok) return;
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;
    await supabase.from("professional_profiles").update({ onboarding_completed_at: new Date().toISOString() }).eq("user_id", authData.user.id);

    if (submitForVerification) {
      const { error } = await supabase.rpc("submit_professional_verification");
      if (error) {
        setMessage(error.message);
        return;
      }
      setVerificationStatus("submitted");
      setNotice("Profilo inviato a CasaPilot per la verifica.");
    } else {
      setNotice("Profilo salvato. Puoi inviarlo per verifica quando è completo.");
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Onboarding professionista</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Costruiamo il profilo una volta sola.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">I dati inseriti durante la registrazione arrivano da Supabase e restano precompilati. Qui aggiungiamo solo ciò che manca.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{verificationStatus}</span>
          </div>

          <div className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${STEP_LABELS.length}, minmax(0,1fr))` }}>
            {STEP_LABELS.map((label, index) => <div key={label}><div className={`h-1.5 rounded-full ${index <= step ? "bg-blue-600" : "bg-slate-200"}`} /><p className={`mt-2 hidden text-[11px] font-bold sm:block ${index === step ? "text-slate-900" : "text-slate-400"}`}>{label}</p></div>)}
          </div>
        </section>

        {message && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{message}</div>}
        {notice && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{notice}</div>}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {step === 0 && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-slate-950">Identità già registrata</h2><p className="mt-2 text-sm leading-6 text-slate-500">Puoi correggere i dati dell’attività senza riscriverli da zero.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyCard label="Nome e cognome" value={fullName} />
                <ReadOnlyCard label="Email confermata" value={email} />
                <label className="block"><span className="text-sm font-bold text-slate-700">Tipo attività</span><select value={professionalType} onChange={(e) => setProfessionalType(e.target.value as "individual" | "organization")} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4"><option value="individual">Libero professionista / ditta individuale</option><option value="organization">Studio, società o impresa</option></select></label>
                <Field label="Telefono" value={phone} onChange={setPhone} />
                {professionalType === "organization" && <Field label="Ragione sociale" value={legalName} onChange={setLegalName} wide />}
                <Field label="Nome professionale / commerciale" value={displayName} onChange={setDisplayName} wide />
                <Field label="Partita IVA" value={vatNumber} onChange={setVatNumber} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold text-slate-950">Sede dell’attività</h2><p className="mt-2 text-sm leading-6 text-slate-500">Scrivi via e civico: CasaPilot mostra i suggerimenti reali e compila automaticamente Comune, CAP e Provincia.</p></div>
              <ItalianAddressAutocomplete label="Indirizzo" value={addressQuery} onChange={setAddressQuery} onSelect={selectAddress} mode="address" city={city} province={province} postcode={postalCode} />
              <div className="grid gap-4 sm:grid-cols-3"><ReadOnlyCard label="CAP" value={postalCode || "—"} /><ReadOnlyCard label="Comune" value={city || "—"} /><ReadOnlyCard label="Provincia" value={province || "—"} /></div>
              {streetAddress && <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><MapPin size={17} />{[streetAddress, postalCode, city, province].filter(Boolean).join(", ")}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold text-slate-950">Descrivi la tua attività</h2><p className="mt-2 text-sm leading-6 text-slate-500">Scrivi liberamente come lavori. Pilot può trasformare gli appunti in una presentazione professionale, senza inventare qualifiche.</p></div>
              <label className="block"><span className="text-sm font-bold text-slate-700">Anni di esperienza</span><input type="number" min={0} max={80} value={years} onChange={(e) => setYears(Number(e.target.value) || 0)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4" /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Raccontaci in poche parole cosa fai</span><textarea value={activityNotes} onChange={(e) => setActivityNotes(e.target.value)} rows={5} placeholder="Es. siamo un’impresa familiare, ci occupiamo di ristrutturazioni, bagni e cucine..." className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
              <button type="button" onClick={() => void improveBio()} disabled={generating} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-50">{generating ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}{generating ? "Pilot sta preparando la bozza…" : "Migliora con Pilot"}</button>
              <label className="block"><span className="text-sm font-bold text-slate-700">Presentazione pubblicabile</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={7} placeholder="La descrizione finale resta sempre modificabile e viene pubblicata solo dopo la tua approvazione." className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-slate-950">Categorie e servizi CasaPilot</h2><p className="mt-2 text-sm leading-6 text-slate-500">Le macro-categorie sono definite da CasaPilot: Pilot userà questi dati strutturati per cercare i professionisti corretti.</p></div>
              <div className="flex gap-2 overflow-x-auto pb-1">{macros.map((macro) => <button key={macro.id} type="button" onClick={() => setSelectedMacro(macro.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${selectedMacro === macro.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>{macro.label}</button>)}</div>
              <div className="grid gap-3 sm:grid-cols-2">{visibleServices.map((service) => { const selected = selectedServices.includes(service.id); return <button key={service.id} type="button" onClick={() => toggleService(service.id)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}><span className="flex items-start justify-between gap-3"><span><span className="block font-bold text-slate-950">{service.label}</span>{service.description && <span className="mt-1 block text-xs leading-5 text-slate-500">{service.description}</span>}</span>{selected && <CheckCircle2 size={18} className="shrink-0 text-blue-600" />}</span></button>; })}</div>
              {selectedLabels.length > 0 && <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Servizi selezionati</p><div className="mt-2 flex flex-wrap gap-2">{selectedLabels.map((label) => <span key={label} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">{label}</span>)}</div></div>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold text-slate-950">Zone operative</h2><p className="mt-2 text-sm leading-6 text-slate-500">Aggiungi Comuni e zone reali. Pilot userà queste informazioni nel matching geografico.</p></div>
              <ItalianAddressAutocomplete label="Aggiungi un Comune" value={areaQuery} onChange={setAreaQuery} onSelect={addArea} mode="municipality" placeholder="Es. Catania" />
              <div className="flex flex-wrap gap-2">{serviceAreas.map((area) => <button key={area} type="button" onClick={() => setServiceAreas((current) => current.filter((value) => value !== area))} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-rose-200 hover:text-rose-700">{area} ×</button>)}</div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-slate-950">Controlla prima dell’invio</h2><p className="mt-2 text-sm leading-6 text-slate-500">Nessun dato viene pubblicato automaticamente. Dopo l’invio il profilo passa alla verifica CasaPilot.</p></div>
              <div className="grid gap-3 sm:grid-cols-2"><Summary label="Attività" value={displayName} /><Summary label="Ragione sociale" value={legalName || fullName} /><Summary label="Sede" value={[streetAddress, city, province].filter(Boolean).join(", ")} /><Summary label="Servizi" value={selectedLabels.join(", ")} /><Summary label="Zone" value={serviceAreas.join(", ")} /><Summary label="Descrizione" value={bio} wide /></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Le verifiche documentali e le abilitazioni saranno gestite in modo distinto dal profilo pubblico. Il badge “verificato” non viene mai assegnato automaticamente.</div>
              <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => void finish(false)} disabled={saving} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"><Save size={17} />Salva profilo</button><button type="button" onClick={() => void finish(true)} disabled={saving || verificationStatus !== "draft"} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50">Invia per verifica<ArrowRight size={17} /></button></div>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => void goBack()} disabled={step === 0 || saving} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 disabled:opacity-30"><ArrowLeft size={17} />Indietro</button>
          {step < STEP_LABELS.length - 1 && <button type="button" onClick={() => void goNext()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : null}Continua<ArrowRight size={17} /></button>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, wide = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) { return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="text-sm font-bold text-slate-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>; }
function ReadOnlyCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value || "—"}</p></div>; }
function Summary({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={`rounded-2xl border border-slate-200 p-4 ${wide ? "sm:col-span-2" : ""}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || "—"}</p></div>; }
