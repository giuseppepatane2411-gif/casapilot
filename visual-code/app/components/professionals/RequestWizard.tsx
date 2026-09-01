"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PROFESSIONAL_CATEGORIES,
  findCategory,
  findService,
  suggestService,
} from "@/lib/professionals/catalog";
import { createLead } from "@/lib/professionals/store";
import type { WizardQuestion } from "@/lib/professionals/types";
import {
  getOwnerRemotePreferences,
  saveOwnerRemotePreferences,
} from "@/lib/remote-layer/repository";
import {
  LANGUAGE_LABELS,
  PRESENCE_LABELS,
} from "@/lib/remote-layer/labels";
import type {
  CommunicationPreference,
  OwnerRemotePreferences,
  PresenceAvailability,
} from "@/lib/remote-layer/types";
import GlossaryCard from "@/components/remote-layer/GlossaryCard";
import { Choice, Frame, Page, Primary, Secondary } from "./ui";

type Phase =
  | "category"
  | "free"
  | "service"
  | "property"
  | "remote"
  | "questions"
  | "details"
  | "summary"
  | "done";

const properties = [
  "Appartamento in Via Roma 24",
  "Casa al mare in Via delle Palme",
  "Nuovo immobile",
];

function Input({
  q,
  value,
  onChange,
}: {
  q: WizardQuestion;
  value: string | string[] | boolean | undefined;
  onChange: (value: string | string[] | boolean) => void;
}) {
  if (q.type === "textarea" || q.type === "text") {
    return q.type === "textarea" ? (
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder={q.placeholder}
        className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    ) : (
      <input
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={q.placeholder}
        className="min-h-14 w-full rounded-2xl border border-slate-200 px-4"
      />
    );
  }

  if (q.type === "number") {
    return (
      <input
        type="number"
        min="0"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-14 w-full rounded-2xl border border-slate-200 px-4"
      />
    );
  }

  if (q.type === "boolean") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice
          title="Sì"
          selected={value === true}
          onClick={() => onChange(true)}
        />
        <Choice
          title="No / non lo so"
          selected={value === false}
          onClick={() => onChange(false)}
        />
      </div>
    );
  }

  if (q.type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-3">
        {q.options?.map((option) => (
          <Choice
            key={option.value}
            title={option.label}
            description={option.description}
            selected={selected.includes(option.value)}
            onClick={() =>
              onChange(
                selected.includes(option.value)
                  ? selected.filter((item) => item !== option.value)
                  : [...selected, option.value],
              )
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {q.options?.map((option) => (
        <Choice
          key={option.value}
          title={option.label}
          description={option.description}
          selected={value === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

export default function RequestWizard({
  initialCategoryId,
  initialServiceId,
}: {
  initialCategoryId?: string;
  initialServiceId?: string;
}) {
  const initial = findService(initialServiceId);
  const [phase, setPhase] = useState<Phase>(
    initial ? "property" : initialCategoryId ? "service" : "category",
  );
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? initialCategoryId ?? "",
  );
  const [serviceId, setServiceId] = useState(initial?.id ?? "");
  const [description, setDescription] = useState("");
  const [suggested, setSuggested] = useState(false);
  const [property, setProperty] = useState("");
  const [location, setLocation] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, string | string[] | boolean>
  >({});
  const [urgency, setUrgency] = useState("Entro un mese");
  const [budget, setBudget] = useState("Da definire");
  const [notes, setNotes] = useState("");
  const [leadId, setLeadId] = useState("");
  const [remote, setRemote] = useState<OwnerRemotePreferences | null>(null);
  const [rememberRemote, setRememberRemote] = useState(true);

  useEffect(() => {
    setRemote(getOwnerRemotePreferences());
  }, []);

  const category = findCategory(categoryId);
  const service = findService(serviceId);
  const question = service?.questions[index];

  const label = useMemo(() => {
    if (phase === "questions" && service) {
      return `Domanda ${index + 1} di ${service.questions.length}`;
    }
    return {
      category: "Passaggio 1",
      free: "Guimmia ti aiuta",
      service: "Passaggio 2",
      property: "Passaggio 3",
      remote: "Presenza e lingua",
      questions: "Domande",
      details: "Ultimi dettagli",
      summary: "Riepilogo",
      done: "Richiesta inviata",
    }[phase];
  }, [phase, index, service]);

  const validQuestion = () => {
    if (!question?.required) return true;
    const value = answers[question.id];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return true;
    return value !== undefined && value.trim().length > 0;
  };

  const goAfterRemote = () => {
    if ((service?.questions.length ?? 0) > 0) {
      setPhase("questions");
    } else {
      setPhase("details");
    }
  };

  const back = () => {
    if (phase === "service" || phase === "free") setPhase("category");
    else if (phase === "property") setPhase("service");
    else if (phase === "remote") setPhase("property");
    else if (phase === "questions") {
      if (index > 0) setIndex(index - 1);
      else setPhase("remote");
    } else if (phase === "details") {
      if ((service?.questions.length ?? 0) > 0) {
        setIndex(Math.max((service?.questions.length ?? 1) - 1, 0));
        setPhase("questions");
      } else {
        setPhase("remote");
      }
    } else if (phase === "summary") setPhase("details");
  };

  const submit = () => {
    if (!category || !service || !property || !location || !remote) return;

    if (rememberRemote) {
      saveOwnerRemotePreferences({
        preferredLanguage: remote.preferredLanguage,
        countryOfResidence: remote.countryOfResidence,
        timezone: remote.timezone,
        presenceAvailability: remote.presenceAvailability,
        specificPresenceDates: remote.specificPresenceDates,
        localContactAvailable: remote.localContactAvailable,
        localContactRole: remote.localContactRole ?? "",
        translationEnabled: remote.translationEnabled,
        translationConsent: remote.translationEnabled,
        communicationPreference:
          remote.communicationPreference ?? "automatic",
        showOriginalByDefault: remote.showOriginalByDefault ?? true,
        videoCallPreferred: remote.videoCallPreferred,
        preferredContactWindows: remote.preferredContactWindows ?? [],
      });
    }

    const lead = createLead({
      ownerId: "demo-owner",
      categoryId: category.id,
      serviceId: service.id,
      propertyLabel: property,
      location,
      answers,
      urgency,
      budget,
      notes,
      remoteContext: {
        ownerLanguage: remote.preferredLanguage,
        countryOfResidence: remote.countryOfResidence,
        timezone: remote.timezone,
        presenceAvailability: remote.presenceAvailability,
        specificPresenceDates:
          remote.presenceAvailability === "specific_dates"
            ? remote.specificPresenceDates
            : undefined,
        localContactAvailable: remote.localContactAvailable,
        localContactRole: remote.localContactRole ?? "",
        translationEnabled: remote.translationEnabled,
        translationConsent: remote.translationEnabled,
        communicationPreference:
          remote.communicationPreference ?? "automatic",
        showOriginalByDefault: remote.showOriginalByDefault ?? true,
        videoCallPreferred: remote.videoCallPreferred,
        preferredContactWindows: remote.preferredContactWindows ?? [],
      },
      status: "submitted",
    });
    setLeadId(lead.id);
    setPhase("done");
  };

  return (
    <Page>
      {phase === "category" ? (
        <Frame
          title="Che cosa devi risolvere?"
          helper="Scegli il bisogno principale, non la professione."
          label={label}
          actions={
            <>
              <Link
                href="/dashboard/professionals"
                className="px-2 py-3 text-sm font-semibold text-slate-600"
              >
                Esci
              </Link>
              <span />
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {PROFESSIONAL_CATEGORIES.map((item) => (
              <Choice
                key={item.id}
                title={item.name}
                description={item.description}
                icon={item.icon}
                onClick={() => {
                  setCategoryId(item.id);
                  setPhase("service");
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPhase("free")}
            className="mt-4 w-full rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-5 text-left"
          >
            <span className="font-semibold text-blue-950">
              Non so quale categoria scegliere
            </span>
            <span className="mt-1 block text-sm text-blue-800">
              Descrivi il problema con parole tue, nella lingua che preferisci.
            </span>
          </button>
        </Frame>
      ) : null}

      {phase === "free" ? (
        <Frame
          title="Descrivi il problema"
          helper="Non servono termini tecnici. Guimmia conserva il testo originale."
          label={label}
          actions={
            <>
              <Secondary onClick={back}>Indietro</Secondary>
              <Primary
                disabled={description.trim().length < 8}
                onClick={() => {
                  const suggestion = suggestService(description);
                  setServiceId(suggestion.id);
                  setCategoryId(suggestion.categoryId);
                  setSuggested(true);
                }}
              >
                Trova il servizio
              </Primary>
            </>
          }
        >
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setSuggested(false);
            }}
            rows={6}
            placeholder="La planimetria non sembra corrispondere alla casa..."
            className="w-full rounded-2xl border border-slate-200 p-4"
          />
          {suggested && service ? (
            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-950">
                Guimmia suggerisce
              </p>
              <p className="mt-1 text-lg font-semibold">{service.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {service.shortDescription}
              </p>
              <div className="mt-4 flex gap-3">
                <Primary onClick={() => setPhase("property")}>
                  Continua
                </Primary>
                <Secondary onClick={() => setPhase("category")}>
                  Altre possibilità
                </Secondary>
              </div>
            </div>
          ) : null}
        </Frame>
      ) : null}

      {phase === "service" && category ? (
        <Frame
          title="Quale risultato vuoi ottenere?"
          helper={`Categoria: ${category.name}`}
          label={label}
          actions={
            <>
              <Secondary onClick={back}>Indietro</Secondary>
              <span />
            </>
          }
        >
          <div className="grid gap-3">
            {category.services.map((item) => (
              <Choice
                key={item.id}
                title={item.name}
                description={item.shortDescription}
                onClick={() => {
                  setServiceId(item.id);
                  setIndex(0);
                  setAnswers({});
                  setPhase("property");
                }}
              />
            ))}
          </div>
        </Frame>
      ) : null}

      {phase === "property" ? (
        <Frame
          title="A quale immobile si riferisce?"
          helper="Guimmia riutilizzerà i dati già presenti."
          label={label}
          actions={
            <>
              <Secondary onClick={back}>Indietro</Secondary>
              <Primary
                disabled={!property || !location.trim()}
                onClick={() => setPhase("remote")}
              >
                Continua
              </Primary>
            </>
          }
        >
          <div className="grid gap-3">
            {properties.map((item) => (
              <Choice
                key={item}
                title={item}
                selected={property === item}
                onClick={() => setProperty(item)}
              />
            ))}
          </div>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold">
              Comune o zona
            </span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bologna, zona centro"
              className="min-h-14 w-full rounded-2xl border border-slate-200 px-4"
            />
            <span className="mt-2 block text-xs text-slate-500">
              L'indirizzo completo resta nascosto finché non serve.
            </span>
          </label>
        </Frame>
      ) : null}

      {phase === "remote" && remote ? (
        <Frame
          title="Puoi essere presente presso l'immobile?"
          helper="La distanza non cambia il percorso: aiuta Guimmia a scegliere professionisti e servizi gestibili correttamente."
          label={label}
          actions={
            <>
              <Secondary onClick={back}>Indietro</Secondary>
              <Primary
                disabled={
                  remote.presenceAvailability === "specific_dates" &&
                  !remote.specificPresenceDates.trim()
                }
                onClick={goAfterRemote}
              >
                Continua
              </Primary>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              Object.keys(PRESENCE_LABELS) as PresenceAvailability[]
            ).map((presence) => (
              <Choice
                key={presence}
                title={PRESENCE_LABELS[presence]}
                selected={remote.presenceAvailability === presence}
                onClick={() =>
                  setRemote({ ...remote, presenceAvailability: presence })
                }
              />
            ))}
          </div>

          {remote.presenceAvailability === "specific_dates" ? (
            <input
              value={remote.specificPresenceDates}
              onChange={(event) =>
                setRemote({
                  ...remote,
                  specificPresenceDates: event.target.value,
                })
              }
              placeholder="Date o periodo in cui sarai presente"
              className="mt-4 min-h-14 w-full rounded-2xl border border-slate-200 px-4"
            />
          ) : null}

          <div className="mt-5 grid gap-3">
            <Choice
              title="Ho una persona di fiducia sul posto"
              selected={remote.localContactAvailable}
              onClick={() =>
                setRemote({
                  ...remote,
                  localContactAvailable: !remote.localContactAvailable,
                })
              }
            />
            {remote.localContactAvailable ? (
              <input
                value={remote.localContactRole ?? ""}
                onChange={(event) =>
                  setRemote({
                    ...remote,
                    localContactRole: event.target.value,
                  })
                }
                placeholder="Chi è il referente? Familiare, vicino, amministratore..."
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
              />
            ) : null}
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Modalità di comunicazione
              </p>
              <select
                value={remote.communicationPreference ?? "automatic"}
                onChange={(event) => {
                  const preference =
                    event.target.value as CommunicationPreference;
                  setRemote({
                    ...remote,
                    communicationPreference: preference,
                    translationEnabled: preference !== "direct_only",
                  });
                }}
                className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="automatic">Guimmia decide quando tradurre</option>
                <option value="direct_preferred">Preferisco una lingua in comune</option>
                <option value="translation_allowed">La traduzione va bene</option>
                <option value="direct_only">Solo comunicazione diretta</option>
              </select>
            </div>
            <Choice
              title={`Traduci le conversazioni in ${LANGUAGE_LABELS[remote.preferredLanguage]}`}
              description="Il testo originale rimane sempre disponibile. Costi, contratti e documenti ufficiali seguono regole più prudenti."
              selected={remote.translationEnabled}
              onClick={() =>
                setRemote({
                  ...remote,
                  translationEnabled: !remote.translationEnabled,
                  communicationPreference: !remote.translationEnabled
                    ? "translation_allowed"
                    : "direct_only",
                })
              }
            />
            <Choice
              title="Mostra l'originale per contenuti sensibili"
              selected={remote.showOriginalByDefault ?? true}
              onClick={() =>
                setRemote({
                  ...remote,
                  showOriginalByDefault:
                    !(remote.showOriginalByDefault ?? true),
                })
              }
            />
            <Choice
              title="Preferisco una videochiamata quando è utile"
              selected={remote.videoCallPreferred}
              onClick={() =>
                setRemote({
                  ...remote,
                  videoCallPreferred: !remote.videoCallPreferred,
                })
              }
            />
            <Choice
              title="Ricorda queste impostazioni per le prossime richieste"
              selected={rememberRemote}
              onClick={() => setRememberRemote((value) => !value)}
            />
          </div>

          <Link
            href="/dashboard/professionals/preferences"
            className="mt-5 inline-flex text-sm font-semibold text-blue-600"
          >
            Modifica lingua, paese e fuso orario →
          </Link>
        </Frame>
      ) : null}

      {phase === "questions" && question && service ? (
        <Frame
          title={question.label}
          helper={question.helper ?? `Servizio: ${service.name}`}
          label={label}
          actions={
            <>
              <Secondary onClick={back}>Indietro</Secondary>
              <Primary
                disabled={!validQuestion()}
                onClick={() =>
                  index < service.questions.length - 1
                    ? setIndex(index + 1)
                    : setPhase("details")
                }
              >
                Continua
              </Primary>
            </>
          }
        >
          <Input
            q={question}
            value={answers[question.id]}
            onChange={(value) =>
              setAnswers({ ...answers, [question.id]: value })
            }
          />
        </Frame>
      ) : null}

      {phase === "details" ? (
        <Frame
          title="Ultimi dettagli"
          helper="Servono a migliorare l'abbinamento, non a imporre il prezzo."
          label={label}
          actions={
            <>
              <Secondary onClick={back}>Indietro</Secondary>
              <Primary onClick={() => setPhase("summary")}>
                Riepilogo
              </Primary>
            </>
          }
        >
          <div className="grid gap-5">
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Quando ti serve?
              </span>
              <select
                value={urgency}
                onChange={(event) => setUrgency(event.target.value)}
                className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4"
              >
                <option>Il prima possibile</option>
                <option>Entro una settimana</option>
                <option>Entro un mese</option>
                <option>Non ho una scadenza</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Budget indicativo
              </span>
              <select
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4"
              >
                <option>Da definire</option>
                <option>Meno di 250 €</option>
                <option>250–500 €</option>
                <option>500–1.000 €</option>
                <option>1.000–5.000 €</option>
                <option>Oltre 5.000 €</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Note utili
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 p-4"
              />
            </label>
          </div>
        </Frame>
      ) : null}

      {phase === "summary" && category && service && remote ? (
        <Frame
          title="Controlla la richiesta"
          helper="Massimo tre professionisti. Recapiti nascosti fino alla scelta."
          label={label}
          actions={
            <>
              <Secondary onClick={back}>Modifica</Secondary>
              <Primary onClick={submit}>Invia la richiesta</Primary>
            </>
          }
        >
          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {[
              ["Categoria", category.name],
              ["Servizio", service.name],
              ["Immobile", property],
              ["Zona", location],
              ["Urgenza", urgency],
              ["Budget", budget],
              ["Presenza", PRESENCE_LABELS[remote.presenceAvailability]],
              ["Lingua", LANGUAGE_LABELS[remote.preferredLanguage]],
              [
                "Comunicazione",
                (remote.communicationPreference ?? "automatic").replaceAll("_", " "),
              ],
              [
                "Traduzione",
                remote.translationEnabled ? "Attiva" : "Non richiesta",
              ],
            ].map(([key, value]) => (
              <div
                key={key}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_1fr]"
              >
                <dt className="text-sm text-slate-500">{key}</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {service.id.includes("catastal") ||
          service.id.includes("urban") ||
          service.id.includes("energet") ? (
            <div className="mt-5">
              <GlossaryCard
                language={remote.preferredLanguage}
                entryIds={[
                  "visura-catastale",
                  "planimetria",
                  "conformita-urbanistica",
                  "ape",
                ]}
              />
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            Confermando autorizzi la condivisione delle sole informazioni
            necessarie. Telefono ed email non saranno mostrati. La lingua e la
            gestione a distanza migliorano il matching, ma non sostituiscono i
            requisiti professionali del servizio.
          </div>
        </Frame>
      ) : null}

      {phase === "done" ? (
        <Frame
          title="Richiesta inviata"
          helper="Guimmia sta cercando i professionisti compatibili."
          label={label}
          actions={
            <>
              <Link
                href="/dashboard/professionals"
                className="px-2 py-3 text-sm font-semibold text-slate-600"
              >
                Servizi
              </Link>
              <Link
                href="/dashboard/professionals/requests"
                className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Segui la richiesta
              </Link>
            </>
          }
        >
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-900">
              Codice: {leadId}
            </p>
            <div className="mt-3 space-y-2 text-sm text-emerald-800">
              <p>✓ Richiesta completata</p>
              <p>✓ Preferenze di lingua e presenza applicate</p>
              <p>● Ricerca professionisti</p>
              <p className="opacity-60">○ Richiesta visualizzata</p>
              <p className="opacity-60">○ Preventivi ricevuti</p>
              <p className="opacity-60">○ Professionista scelto</p>
            </div>
          </div>
        </Frame>
      ) : null}
    </Page>
  );
}
