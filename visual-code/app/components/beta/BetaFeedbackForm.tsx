"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  MessageSquareText,
  Send,
  Share2,
} from "lucide-react";

import { useBetaState } from "@/hooks/useBetaState";
import { useJourneys } from "@/hooks/useJourneys";
import { BETA_USEFUL_AREAS } from "@/lib/beta/constants";
import {
  buildFeedbackShareText,
  markFeedbackShared,
  saveBetaFeedback,
} from "@/lib/beta/storage";
import type {
  BetaFeedbackEntry,
  BetaUsefulArea,
  BetaWillingness,
} from "@/lib/beta/types";

const willingnessOptions: Array<{
  id: BetaWillingness;
  label: string;
  description: string;
}> = [
  {
    id: "yes",
    label: "Sì",
    description: "Mi ha fatto risparmiare tempo o confusione.",
  },
  {
    id: "maybe",
    label: "Forse",
    description: "Dipenderebbe dal prezzo e dalle funzioni finali.",
  },
  {
    id: "no",
    label: "No",
    description: "Per ora non vedo abbastanza valore.",
  },
];

export default function BetaFeedbackForm({
  defaultJourneyId = null,
  compact = false,
}: {
  defaultJourneyId?: string | null;
  compact?: boolean;
}) {
  const { activeJourney } = useJourneys();
  const { state } = useBetaState();
  const [clarity, setClarity] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [usefulArea, setUsefulArea] = useState<BetaUsefulArea | null>(null);
  const [willingness, setWillingness] = useState<BetaWillingness | null>(null);
  const [confusingPart, setConfusingPart] = useState("");
  const [comment, setComment] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [savedEntry, setSavedEntry] = useState<BetaFeedbackEntry | null>(null);
  const [shareStatus, setShareStatus] = useState("");

  const journeyId = defaultJourneyId ?? activeJourney?.id ?? null;
  const previousFeedback = useMemo(
    () => state?.feedback.find((entry) => entry.journeyId === journeyId) ?? null,
    [journeyId, state?.feedback],
  );

  function submitFeedback() {
    if (!clarity) {
      setValidationMessage("Indica quanto è stato chiaro il percorso.");
      return;
    }
    if (!usefulArea) {
      setValidationMessage("Scegli la parte che ti è sembrata più utile.");
      return;
    }
    if (!willingness) {
      setValidationMessage("Rispondi alla domanda sul valore del prodotto.");
      return;
    }

    const entry = saveBetaFeedback({
      journeyId,
      clarity,
      usefulArea,
      willingness,
      confusingPart,
      comment,
    });

    setSavedEntry(entry);
    setValidationMessage("");
  }

  async function copyFeedback(entry: BetaFeedbackEntry) {
    const text = buildFeedbackShareText(entry);

    try {
      await navigator.clipboard.writeText(text);
      markFeedbackShared(entry.id);
      setShareStatus("Feedback copiato. Ora puoi incollarlo in WhatsApp o in un’email.");
    } catch {
      setShareStatus("Non siamo riusciti a copiare automaticamente il testo.");
    }
  }

  async function shareFeedback(entry: BetaFeedbackEntry) {
    const text = buildFeedbackShareText(entry);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Feedback CasaPilot Beta",
          text,
        });
        markFeedbackShared(entry.id);
        setShareStatus("Feedback condiviso. Grazie.");
        return;
      } catch {
        return;
      }
    }

    await copyFeedback(entry);
  }

  function downloadFeedback(entry: BetaFeedbackEntry) {
    const blob = new Blob([buildFeedbackShareText(entry)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feedback-casapilot-${new Date(entry.createdAt)
      .toISOString()
      .slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    markFeedbackShared(entry.id);
    setShareStatus("File feedback scaricato.");
  }

  if (savedEntry) {
    return (
      <section className={`rounded-[30px] border border-emerald-200 bg-emerald-50 ${compact ? "p-5" : "p-6 sm:p-8"}`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
          <CheckCircle2 size={23} />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-emerald-950">Feedback salvato nel browser.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-800">
          Non usiamo ancora un database. Per far arrivare il feedback al team, condividilo oppure copialo e invialo nel canale con cui hai ricevuto la beta.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => shareFeedback(savedEntry)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Share2 size={18} />
            Condividi feedback
          </button>
          <button
            type="button"
            onClick={() => copyFeedback(savedEntry)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-white px-5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
          >
            <Clipboard size={18} />
            Copia testo
          </button>
          <button
            type="button"
            onClick={() => downloadFeedback(savedEntry)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-white px-5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
          >
            <Download size={18} />
            Scarica .txt
          </button>
        </div>
        {shareStatus && (
          <p className="mt-4 rounded-2xl bg-white/70 p-3 text-sm font-semibold text-emerald-800">
            {shareStatus}
          </p>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <header>
          <Link
            href="/dashboard/beta"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Torna al Beta Lab
          </Link>
          <div className="mt-5 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <MessageSquareText size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-violet-700">Validazione del prodotto</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">Raccontaci la verità, non farci un favore.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Le risposte negative sono preziose: ci aiutano a non costruire funzioni che nessuno vuole usare.
              </p>
            </div>
          </div>
        </header>
      )}

      {previousFeedback && !compact && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Hai già salvato un feedback per questa pratica il {new Date(previousFeedback.createdAt).toLocaleDateString("it-IT")}. Puoi inviarne un altro dopo una nuova prova.
        </div>
      )}

      <section className={`rounded-[30px] border border-slate-200 bg-white shadow-sm ${compact ? "p-5" : "p-5 sm:p-8"}`}>
        <div className="space-y-8">
          <Question
            number="1"
            title="CasaPilot ti ha fatto capire cosa fare dopo?"
            description="1 significa per niente chiaro, 5 significa chiarissimo."
          >
            <div className="grid grid-cols-5 gap-2 sm:max-w-xl sm:gap-3">
              {([1, 2, 3, 4, 5] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={clarity === value}
                  onClick={() => {
                    setClarity(value);
                    setValidationMessage("");
                  }}
                  className={`flex min-h-14 items-center justify-center rounded-2xl border text-lg font-bold ${
                    clarity === value
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </Question>

          <Question
            number="2"
            title="Qual è stata la parte più utile?"
            description="Scegli il punto in cui hai percepito più valore."
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BETA_USEFUL_AREAS.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  aria-pressed={usefulArea === area.id}
                  onClick={() => {
                    setUsefulArea(area.id);
                    setValidationMessage("");
                  }}
                  className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-left text-sm font-bold ${
                    usefulArea === area.id
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    usefulArea === area.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    {usefulArea === area.id ? <Check size={14} strokeWidth={3} /> : null}
                  </span>
                  {area.label}
                </button>
              ))}
            </div>
          </Question>

          <Question
            number="3"
            title="Pagheresti per continuare a usare CasaPilot?"
            description="Non stiamo chiedendo un pagamento: vogliamo misurare il valore percepito."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {willingnessOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={willingness === option.id}
                  onClick={() => {
                    setWillingness(option.id);
                    setValidationMessage("");
                  }}
                  className={`rounded-2xl border p-4 text-left ${
                    willingness === option.id
                      ? "border-blue-600 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <span className="font-bold text-slate-950">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                </button>
              ))}
            </div>
          </Question>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-900">Cosa ti ha confuso?</span>
              <span className="mt-1 block text-xs text-slate-500">Anche una parola, un pulsante o un passaggio.</span>
              <textarea
                value={confusingPart}
                onChange={(event) => setConfusingPart(event.target.value)}
                rows={4}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Esempio: non capivo cosa significasse Health Score…"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-900">Cosa cambieresti per prima?</span>
              <span className="mt-1 block text-xs text-slate-500">La risposta più importante di tutto il test.</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Scrivi la modifica che renderebbe CasaPilot più utile…"
              />
            </label>
          </div>

          {validationMessage && (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {validationMessage}
            </p>
          )}

          <button
            type="button"
            onClick={submitFeedback}
            className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 hover:bg-blue-600 sm:w-auto"
          >
            <Send size={18} />
            Salva il feedback
          </button>
        </div>
      </section>

      {!compact && (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
          Il feedback viene salvato localmente. Dopo il salvataggio potrai condividerlo con il team tramite il menu del tuo dispositivo, copiarlo oppure scaricarlo come file di testo.
        </p>
      )}
    </div>
  );
}

function Question({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
          {number}
        </span>
        <span>
          <span className="block text-lg font-bold text-slate-950">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
        </span>
      </legend>
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}
