"use client";

import { useMemo, useState } from "react";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/lib/remote-layer/labels";
import { classifyContentSensitivity, translationPolicyFor } from "@/lib/remote-layer/policy";
import { detectLanguage, translateLocally } from "@/lib/remote-layer/translation";
import type {
  CommunicationPreference,
  LanguageCode,
} from "@/lib/remote-layer/types";
import { Heading, Page } from "@/components/professionals/ui";

const EXAMPLES = [
  "Possiamo programmare il sopralluogo la prossima settimana.",
  "Per iniziare mi servono la visura catastale, la planimetria e l'atto di provenienza.",
  "Il preventivo è di 850 euro più IVA e richiede un acconto del 30%.",
  "La procura deve essere firmata prima dell'atto notarile.",
  "Questo è il documento ufficiale firmato dal notaio.",
];

export default function CommunicationSafetyCenter() {
  const [text, setText] = useState(EXAMPLES[1]);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("en");
  const [preference, setPreference] =
    useState<CommunicationPreference>("automatic");

  const result = useMemo(() => {
    const sourceLanguage = detectLanguage(text);
    const sensitivity = classifyContentSensitivity(text);
    const policy = translationPolicyFor(sensitivity, preference);
    const translation = translateLocally(
      text,
      sourceLanguage,
      targetLanguage,
      preference,
    );
    return { sourceLanguage, sensitivity, policy, translation };
  }, [preference, targetLanguage, text]);

  return (
    <Page>
      <Heading
        eyebrow="Controllo amministrativo"
        title="Laboratorio comunicazione"
        description="Verifica come CasaPilot tratta messaggi ordinari, tecnici, economici, legali e documenti ufficiali prima di collegare un provider reale."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Simula un messaggio
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((example, index) => (
              <button
                key={example}
                type="button"
                onClick={() => setText(example)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300"
              >
                Esempio {index + 1}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={7}
            className="mt-4 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Lingua di destinazione
              </span>
              <select
                value={targetLanguage}
                onChange={(event) =>
                  setTargetLanguage(event.target.value as LanguageCode)
                }
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4"
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {LANGUAGE_LABELS[language]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Preferenza utente
              </span>
              <select
                value={preference}
                onChange={(event) =>
                  setPreference(
                    event.target.value as CommunicationPreference,
                  )
                }
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4"
              >
                <option value="automatic">Pilot decide</option>
                <option value="direct_preferred">Diretta preferita</option>
                <option value="translation_allowed">Traduzione consentita</option>
                <option value="direct_only">Solo diretta</option>
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Risultato visibile
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {result.translation.translatedText ?? result.translation.originalText}
            </p>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Decisione di Pilot
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-blue-700">Lingua rilevata</dt>
                <dd className="font-semibold">
                  {LANGUAGE_LABELS[result.sourceLanguage]}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-blue-700">Sensibilità</dt>
                <dd className="font-semibold">
                  {result.sensitivity.replaceAll("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-blue-700">Stato</dt>
                <dd className="font-semibold">
                  {result.translation.status.replaceAll("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-blue-700">Metodo</dt>
                <dd className="font-semibold">
                  {(result.translation.method ?? "none").replaceAll("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-blue-700">Revisione</dt>
                <dd className="font-semibold">
                  {result.policy.reviewRequired ? "Richiesta" : "Non richiesta"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="font-semibold">Avviso mostrato all’utente</h2>
            <p className="mt-3 text-sm leading-6">{result.policy.notice}</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Termini riconosciuti</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(result.translation.glossaryReferences ?? []).length > 0 ? (
                result.translation.glossaryReferences?.map((reference) => (
                  <span
                    key={reference.term}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700"
                  >
                    {reference.term}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Nessun termine del glossario locale.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </Page>
  );
}
