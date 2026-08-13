"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BriefcaseBusiness,
  Euro,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type MatchRow = {
  id: string;
  request_id: string;
  status: string;
  created_at: string;
  marketplace_requests:
    | {
        id: string;
        title: string;
        description: string;
        city: string | null;
        province: string | null;
        status: string;
        marketplace_services:
          | { label: string; slug: string }
          | { label: string; slug: string }[]
          | null;
      }
    | {
        id: string;
        title: string;
        description: string;
        city: string | null;
        province: string | null;
        status: string;
        marketplace_services:
          | { label: string; slug: string }
          | { label: string; slug: string }[]
          | null;
      }[]
    | null;
};

type QuoteRow = {
  id: string;
  request_id: string;
  amount_cents: number;
  summary: string;
  status: string;
  submitted_at: string;
};

function requestFromMatch(match: MatchRow) {
  return Array.isArray(match.marketplace_requests)
    ? match.marketplace_requests[0] ?? null
    : match.marketplace_requests;
}

function requestCategory(match: MatchRow) {
  const request = requestFromMatch(match);
  if (!request) return "Richiesta";
  const category = request.marketplace_services;
  if (Array.isArray(category)) return category[0]?.label ?? "Richiesta";
  return category?.label ?? "Richiesta";
}

export default function ProfessionalMarketplace() {
  const supabase = useMemo(() => createClient(), []);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [selectedRequest, setSelectedRequest] = useState("");
  const [amount, setAmount] = useState("");
  const [summary, setSummary] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMessage("Sessione professionista non disponibile.");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    const [matchResult, quoteResult] = await Promise.all([
      supabase
        .from("marketplace_matches")
        .select(
          "id,request_id,status,created_at,marketplace_requests!inner(id,title,description,city,province,status,marketplace_services(label,slug,marketplace_macro_categories(label)))",
        )
        .eq("professional_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("marketplace_quotes")
        .select("id,request_id,amount_cents,summary,status,submitted_at")
        .eq("professional_user_id", userId)
        .order("submitted_at", { ascending: false }),
    ]);

    if (matchResult.error) {
      setMessage(matchResult.error.message);
    } else {
      const rows = (matchResult.data ?? []) as unknown as MatchRow[];
      setMatches(rows);
      setSelectedRequest((current) => current || rows[0]?.request_id || "");
    }

    if (quoteResult.error) {
      setMessage(quoteResult.error.message);
    } else {
      setQuotes((quoteResult.data ?? []) as QuoteRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const numericAmount = Number(amount.replace(",", "."));
    if (!selectedRequest || !Number.isFinite(numericAmount) || numericAmount <= 0 || !summary.trim()) {
      setMessage("Seleziona una richiesta e completa importo e descrizione del preventivo.");
      return;
    }

    const days = estimatedDays ? Number.parseInt(estimatedDays, 10) : null;
    setSubmitting(true);

    const { error } = await supabase.rpc("submit_marketplace_quote", {
      p_request_id: selectedRequest,
      p_amount_cents: Math.round(numericAmount * 100),
      p_summary: summary.trim(),
      p_scope_items: [],
      p_exclusions: null,
      p_estimated_days: Number.isFinite(days) ? days : null,
      p_valid_until: null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setAmount("");
      setSummary("");
      setEstimatedDays("");
      setMessage("Preventivo inviato attraverso CasaPilot.");
      await load();
    }

    setSubmitting(false);
  }

  return (
    <div className="space-y-7 p-4 sm:p-6 lg:p-8">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
              <BriefcaseBusiness size={15} />
              Marketplace Professionisti
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Richieste pertinenti, preventivi dentro CasaPilot.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Il Marketplace mantiene separati profilo, richiesta e preventivo. I recapiti diretti
              non fanno parte del preventivo e verranno sbloccati solo dal flusso previsto.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="flex items-center gap-2 font-bold"><ShieldCheck size={17} /> Profilo verificato richiesto per il matching</p>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {message}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Richieste abbinate</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{matches.length}</h2>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Aggiorna"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {!loading && matches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm leading-6 text-slate-500">
                Nessuna richiesta assegnata. Il matching richiede un profilo verificato e un servizio compatibile.
              </div>
            )}
            {matches.map((match) => {
              const request = requestFromMatch(match);
              const existing = quotes.find((quote) => quote.request_id === match.request_id);
              if (!request) return null;
              return (
                <article key={match.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{requestCategory(match)}</p>
                      <h3 className="mt-1 font-bold text-slate-950">{request.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {existing ? "Preventivo inviato" : match.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{request.description}</p>
                  {(request.city || request.province) && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <MapPin size={14} />
                      {[request.city, request.province].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(match.request_id)}
                    className="mt-4 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Prepara preventivo
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Nuovo preventivo</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Invia una proposta</h2>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Richiesta</span>
              <select
                value={selectedRequest}
                onChange={(event) => setSelectedRequest(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Seleziona</option>
                {matches.map((match) => {
                  const request = requestFromMatch(match);
                  return request ? (
                    <option key={match.id} value={match.request_id}>
                      {request.title}
                    </option>
                  ) : null;
                })}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Importo totale</span>
              <div className="relative mt-2">
                <Euro size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="450"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Cosa comprende</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={5}
                placeholder="Descrivi attività, inclusioni e condizioni principali."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Giorni stimati</span>
              <input
                inputMode="numeric"
                value={estimatedDays}
                onChange={(event) => setEstimatedDays(event.target.value.replace(/\D/g, ""))}
                placeholder="5"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !selectedRequest}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} />
              {submitting ? "Invio…" : "Invia preventivo"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
