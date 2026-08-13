"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, BriefcaseBusiness, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import ItalianAddressAutocomplete, { type LocationSelection } from "@/components/professional-onboarding/ItalianAddressAutocomplete";
import { createClient } from "@/lib/supabase/client";

type Service = { id: string; slug: string; label: string; regulatory_class: string; marketplace_macro_categories: { label: string } | { label: string }[] | null };
type RequestRow = { id: string; title: string; description: string; status: string; city: string | null; province: string | null; created_at: string; marketplace_services: { label: string } | { label: string }[] | null };
function relationLabel(value: { label: string } | { label: string }[] | null) { return Array.isArray(value) ? value[0]?.label ?? "Servizio" : value?.label ?? "Servizio"; }

export default function OwnerMarketplace() {
  const supabase = useMemo(() => createClient(), []);
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [serviceSlug, setServiceSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [location, setLocation] = useState<LocationSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [serviceResult, requestResult] = await Promise.all([
      supabase.from("marketplace_services").select("id,slug,label,regulatory_class,marketplace_macro_categories(label)").eq("active", true).neq("regulatory_class", "excluded_initially").order("sort_order"),
      supabase.from("marketplace_requests").select("id,title,description,status,city,province,created_at,marketplace_services(label)").order("created_at", { ascending: false }),
    ]);
    if (serviceResult.error) setMessage(serviceResult.error.message); else { const rows = (serviceResult.data ?? []) as unknown as Service[]; setServices(rows); setServiceSlug((current) => current || rows[0]?.slug || ""); }
    if (requestResult.error) setMessage(requestResult.error.message); else setRequests((requestResult.data ?? []) as unknown as RequestRow[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceSlug || !title.trim() || !description.trim()) { setMessage("Completa servizio, titolo e descrizione."); return; }
    setSubmitting(true); setMessage(null);
    const { error } = await supabase.rpc("create_marketplace_request", {
      p_service_slug: serviceSlug,
      p_title: title.trim(),
      p_description: description.trim(),
      p_city: location?.city || null,
      p_province: location?.province || null,
      p_postal_code: location?.postalCode || null,
      p_property_ref: null,
    });
    if (error) setMessage(error.message); else { setTitle(""); setDescription(""); setLocationQuery(""); setLocation(null); setMessage("Richiesta creata. CasaPilot potrà associare fino a 3 professionisti pertinenti."); await load(); }
    setSubmitting(false);
  }

  return <div className="space-y-7">
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700"><BriefcaseBusiness size={15}/>Marketplace CasaPilot</div><h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Una richiesta strutturata, fino a 3 professionisti pertinenti.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Pilot userà categorie e servizi definiti da CasaPilot, non parole libere inserite dai professionisti.</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-900"><ShieldCheck size={17} className="inline mr-2"/>Matching documentabile</div></div></section>
    {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{message}</div>}
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-2xl font-bold text-slate-950">Nuova richiesta</h2><div className="mt-5 space-y-4">
        <label className="block"><span className="text-sm font-bold text-slate-700">Servizio</span><select value={serviceSlug} onChange={(e)=>setServiceSlug(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm">{services.map((item)=><option key={item.id} value={item.slug}>{relationLabel(item.marketplace_macro_categories)} · {item.label}</option>)}</select></label>
        <label className="block"><span className="text-sm font-bold text-slate-700">Titolo</span><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Es. Devo rifare il bagno" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm"/></label>
        <label className="block"><span className="text-sm font-bold text-slate-700">Descrizione</span><textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={5} placeholder="Spiega il lavoro, i tempi e le informazioni utili." className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm leading-6"/></label>
        <ItalianAddressAutocomplete label="Dove si trova l’immobile?" value={locationQuery} onChange={setLocationQuery} onSelect={setLocation} mode="municipality" placeholder="Comune"/>
        {location && <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600"><MapPin size={16}/>{[location.city, location.province].filter(Boolean).join(" · ")}</p>}
        <button type="submit" disabled={submitting || loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Creazione…" : "Crea richiesta"}<ArrowRight size={17}/></button>
      </div></form>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Le tue richieste</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{requests.length}</h2></div><button type="button" onClick={()=>void load()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button></div><div className="mt-5 space-y-3">{!loading && requests.length===0 && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Non hai ancora richieste Marketplace.</div>}{requests.map((request)=><article key={request.id} className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{relationLabel(request.marketplace_services)}</p><h3 className="mt-1 font-bold text-slate-950">{request.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{request.description}</p><div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-400"><span>{[request.city, request.province].filter(Boolean).join(" · ") || "Posizione da definire"}</span><span>{request.status}</span></div></article>)}</div></section>
    </section>
  </div>;
}
