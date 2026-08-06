"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COUNTRY_OPTIONS,
  LANGUAGE_LABELS,
  PRESENCE_LABELS,
  SUPPORTED_LANGUAGES,
} from "@/lib/remote-layer/labels";
import {
  getOwnerRemotePreferences,
  saveOwnerRemotePreferences,
} from "@/lib/remote-layer/repository";
import type {
  CommunicationPreference,
  LanguageCode,
  OwnerRemotePreferences,
  PresenceAvailability,
} from "@/lib/remote-layer/types";
import { Choice, Heading, Page, Primary } from "@/components/professionals/ui";
import ProfessionalNav from "@/components/professionals/ProfessionalNav";

const COMMUNICATION_OPTIONS: Array<{
  value: CommunicationPreference;
  title: string;
  description: string;
}> = [
  {
    value: "automatic",
    title: "Lascia decidere a Pilot",
    description:
      "Pilot usa la lingua in comune quando esiste e attiva la traduzione soltanto quando serve.",
  },
  {
    value: "direct_preferred",
    title: "Preferisco parlare direttamente",
    description:
      "I professionisti che parlano la tua lingua ricevono un vantaggio nel matching.",
  },
  {
    value: "translation_allowed",
    title: "La traduzione va bene",
    description:
      "CasaPilot può mediare la conversazione mantenendo sempre disponibile il testo originale.",
  },
  {
    value: "direct_only",
    title: "Solo comunicazione diretta",
    description:
      "Pilot mostrerà soltanto professionisti con una lingua in comune.",
  },
];

export default function OwnerRemotePreferencesPage() {
  const [value, setValue] = useState<OwnerRemotePreferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(getOwnerRemotePreferences());
  }, []);

  const summary = useMemo(() => {
    if (!value) return "";
    const remote = value.presenceAvailability !== "available";
    const translated = value.communicationPreference !== "direct_only";
    return [
      remote ? "gestione a distanza" : "presenza disponibile",
      translated ? "traduzione consentita" : "solo lingua comune",
      value.localContactAvailable ? "referente locale disponibile" : "nessun referente locale",
    ].join(" · ");
  }, [value]);

  if (!value) return <Page>Caricamento impostazioni…</Page>;

  const update = <K extends keyof OwnerRemotePreferences>(
    key: K,
    next: OwnerRemotePreferences[K],
  ) => {
    setSaved(false);
    setValue((current) => (current ? { ...current, [key]: next } : current));
  };

  const persist = () => {
    const communicationPreference = value.communicationPreference ?? "automatic";
    const translationEnabled =
      communicationPreference !== "direct_only" &&
      (value.preferredLanguage !== "it" || value.translationEnabled);

    saveOwnerRemotePreferences({
      preferredLanguage: value.preferredLanguage,
      countryOfResidence: value.countryOfResidence,
      timezone: value.timezone,
      presenceAvailability: value.presenceAvailability,
      specificPresenceDates: value.specificPresenceDates,
      localContactAvailable: value.localContactAvailable,
      localContactRole: value.localContactRole ?? "",
      translationEnabled,
      translationConsent: translationEnabled,
      communicationPreference,
      showOriginalByDefault: value.showOriginalByDefault ?? true,
      videoCallPreferred: value.videoCallPreferred,
      preferredContactWindows: value.preferredContactWindows ?? [],
    });
    setSaved(true);
  };

  return (
    <Page>
      <ProfessionalNav />
      <Heading
        eyebrow="Preferenze riutilizzabili"
        title="Lingua, comunicazione e presenza"
        description="Queste impostazioni non creano un percorso separato: aiutano Pilot ad adattare richieste, chat e professionisti quando gestisci un immobile da lontano o preferisci un'altra lingua."
      />

      <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Lingua e residenza
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Pilot usa questi dati per interfaccia, messaggi, orari e spiegazioni.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {summary}
            </span>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Lingua preferita
              </span>
              <select
                value={value.preferredLanguage}
                onChange={(event) => {
                  const language = event.target.value as LanguageCode;
                  update("preferredLanguage", language);
                  if (language !== "it") update("translationEnabled", true);
                }}
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
                Paese di residenza
              </span>
              <select
                value={value.countryOfResidence}
                onChange={(event) =>
                  update("countryOfResidence", event.target.value)
                }
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country}>{country}</option>
                ))}
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold">
                Fuso orario
              </span>
              <input
                value={value.timezone}
                onChange={(event) => update("timezone", event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
              />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Come vuoi comunicare?
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            La lingua non sostituisce mai servizio, zona, requisiti e qualità del professionista.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {COMMUNICATION_OPTIONS.map((option) => (
              <Choice
                key={option.value}
                title={option.title}
                description={option.description}
                selected={
                  (value.communicationPreference ?? "automatic") === option.value
                }
                onClick={() => {
                  update("communicationPreference", option.value);
                  update("translationEnabled", option.value !== "direct_only");
                }}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Choice
              title="Mostra sempre il testo originale"
              description="Consigliato per termini tecnici, costi e contenuti legali."
              selected={value.showOriginalByDefault ?? true}
              onClick={() =>
                update(
                  "showOriginalByDefault",
                  !(value.showOriginalByDefault ?? true),
                )
              }
            />
            <Choice
              title="Preferisco videochiamate quando servono"
              selected={value.videoCallPreferred}
              onClick={() =>
                update("videoCallPreferred", !value.videoCallPreferred)
              }
            />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Presenza presso l'immobile
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Pilot userà queste informazioni soltanto quando il servizio richiede accesso, firma o sopralluogo.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(PRESENCE_LABELS) as PresenceAvailability[]).map(
              (presence) => (
                <Choice
                  key={presence}
                  title={PRESENCE_LABELS[presence]}
                  selected={value.presenceAvailability === presence}
                  onClick={() => update("presenceAvailability", presence)}
                />
              ),
            )}
          </div>

          {value.presenceAvailability === "specific_dates" ? (
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold">
                Date o periodi disponibili
              </span>
              <input
                value={value.specificPresenceDates}
                onChange={(event) =>
                  update("specificPresenceDates", event.target.value)
                }
                placeholder="Ad esempio: dal 12 al 20 settembre"
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
              />
            </label>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
            <Choice
              title="Ho una persona di fiducia sul posto"
              description="Può aprire l'immobile o assistere a un sopralluogo."
              selected={value.localContactAvailable}
              onClick={() =>
                update("localContactAvailable", !value.localContactAvailable)
              }
            />

            {value.localContactAvailable ? (
              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Ruolo del referente
                </span>
                <input
                  value={value.localContactRole ?? ""}
                  onChange={(event) =>
                    update("localContactRole", event.target.value)
                  }
                  placeholder="Familiare, vicino, amministratore..."
                  className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                />
              </label>
            ) : null}
          </div>
        </section>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong>Regola di sicurezza:</strong> messaggi ordinari e tecnici possono essere tradotti automaticamente. Costi, contratti, procure e documenti ufficiali mostrano sempre l'originale e possono richiedere verifica prima di essere usati per una decisione.
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-emerald-700">
            {saved ? "Impostazioni salvate" : ""}
          </p>
          <Primary onClick={persist}>Salva impostazioni</Primary>
        </div>
      </div>
    </Page>
  );
}
