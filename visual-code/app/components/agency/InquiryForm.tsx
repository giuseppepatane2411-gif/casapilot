"use client";

import { FormEvent, useState } from "react";

export default function InquiryForm({
  listingId,
  slug,
}: {
  listingId: string;
  slug: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const fd = new FormData(e.currentTarget);
    const payload = {
      listingId,
      slug,
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      message: fd.get("message"),
      wantsVisit: fd.get("wantsVisit") === "on",
      preferredDate: fd.get("preferredDate"),
      privacy: fd.get("privacy") === "on",
      website: fd.get("website"),
    };

    try {
      const r = await fetch("/api/agency/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? "Invio non riuscito.");
      e.currentTarget.reset();
      setState("ok");
      setFeedback("Richiesta ricevuta. Guimmia ti accompagnerà nel prossimo passo.");
    } catch (err) {
      setState("error");
      setFeedback(err instanceof Error ? err.message : "Errore durante l'invio.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <input required name="name" maxLength={120} placeholder="Nome e cognome" className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-600" />
      <input required name="email" type="email" maxLength={160} placeholder="Email" className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-600" />
      <input name="phone" maxLength={40} placeholder="Telefono" className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-600" />
      <textarea required name="message" rows={4} maxLength={2000} placeholder="Vorrei maggiori informazioni..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" />
      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
        <input type="checkbox" name="wantsVisit" /> Vorrei prenotare una visita
      </label>
      <input type="date" name="preferredDate" className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-600" />
      <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
        <input required type="checkbox" name="privacy" className="mt-1" />
        <span>Accetto l'informativa privacy per essere ricontattato in relazione a questo immobile.</span>
      </label>
      <button disabled={state === "sending"} className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700 disabled:opacity-60">
        {state === "sending" ? "Invio..." : "Richiedi informazioni"}
      </button>
      {feedback ? (
        <p className={`rounded-xl p-3 text-sm font-bold ${state === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
