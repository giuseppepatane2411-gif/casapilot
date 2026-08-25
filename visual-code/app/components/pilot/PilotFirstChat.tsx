"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  classifyGuimmiaBrainRequest,
  formatGuimmiaBrainAnswer,
  requestGuimmiaBrain,
} from "@/lib/guimmia/openai/brain-client";
import { requestSiteOrchestration } from "@/lib/guimmia/site-orchestration/client";
import {
  OPERATION_LABELS,
  detectCustomerRole,
  detectGuimmiaOperationType,
  hasGenericRentalIntent,
  toSiteOperationType,
} from "@/lib/guimmia/site-orchestration/operation";
import type {
  SiteCustomerRole,
  SiteOrchestrationRequest,
  SiteOrchestrationResponse,
} from "@/lib/guimmia/site-orchestration/types";
import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import { INITIAL_WIZARD_DATA } from "@/lib/property-journey/constants";
import { createJourney } from "@/lib/property-journey/storage";
import type { PropertyType } from "@/lib/property-journey/types";

type ChatMessage = {
  id: string;
  sender: "pilot" | "user";
  text: string;
  createdAt: string;
  engine?: "OPENAI" | "CACHE" | "DETERMINISTIC" | "LOCAL";
};

type PropertyDraft = {
  id: string;
  objective: string;
  propertyType: string;
  country: string;
  city: string;
  province: string;
  address: string;
  surface: string;
  rooms: string;
  condition: string;
  occupancy: string;
  notes: string;
  operationType?: GuimmiaOperationType;
  customerRole?: SiteCustomerRole;
  journeyId?: string;
  destinationHref?: string;
  status: "draft" | "confirmed";
  updatedAt: string;
};

const STORAGE_KEY = "casapilot_v73_pilot_session";
const PROPERTY_STORAGE_KEY = "casapilot_v73_properties";

const emptyDraft = (): PropertyDraft => ({
  id: `property_${Date.now()}`,
  objective: "",
  propertyType: "",
  country: "",
  city: "",
  province: "",
  address: "",
  surface: "",
  rooms: "",
  condition: "",
  occupancy: "",
  notes: "",
  status: "draft",
  updatedAt: new Date().toISOString(),
});

const initialMessage: ChatMessage = {
  id: "pilot_welcome",
  sender: "pilot",
  text: "Ciao! Sono Guimmia. Raccontami cosa vuoi fare con il tuo immobile: puoi scriverlo liberamente, organizzerò io le informazioni.",
  createdAt: new Date().toISOString(),
};

function CompassIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m14.9 8.2-1.7 5-5 1.7 1.7-5 5-1.7Z" fill="currentColor" />
    </svg>
  );
}

function detectObjective(text: string) {
  const value = text.toLowerCase();
  if (/(vend|cess|acquirent|compr|compravend)/.test(value)) return "Vendita o acquisto";
  if (/(affitt|locaz|inquilin)/.test(value)) return "Affitto";
  if (/(valut|quanto vale|stima)/.test(value)) return "Valutazione";
  if (/(ristruttur|lavori|rinnov)/.test(value)) return "Ristrutturazione";
  if (/(gest|manuten|amministr)/.test(value)) return "Gestione";
  return "";
}

function detectPropertyType(text: string) {
  const value = text.toLowerCase();
  if (value.includes("villa")) return "Villa";
  if (value.includes("appartamento")) return "Appartamento";
  if (value.includes("casa indipendente")) return "Casa indipendente";
  if (value.includes("casa")) return "Casa";
  if (value.includes("terreno")) return "Terreno";
  if (value.includes("locale")) return "Locale commerciale";
  if (value.includes("ufficio")) return "Ufficio";
  if (value.includes("garage") || value.includes("box")) return "Garage o box";
  return "";
}

function detectSurface(text: string) {
  const match = text.match(/(\d{2,4})\s*(?:mq|m2|m²|metri quadrati)/i);
  return match?.[1] ? `${match[1]} m²` : "";
}

function detectRooms(text: string) {
  const match = text.match(/(\d{1,2})\s*(?:stanze|vani|camere|locali)/i);
  return match?.[1] ?? "";
}

function detectCity(text: string) {
  const common = [
    "Acireale", "Catania", "Palermo", "Messina", "Siracusa", "Ragusa",
    "Milano", "Roma", "Torino", "Bologna", "Firenze", "Napoli", "Bari",
    "Tenerife", "Güímar", "Guimar",
  ];
  return common.find((city) => text.toLowerCase().includes(city.toLowerCase())) ?? "";
}

function detectCountry(text: string, city: string) {
  if (/(spagna|spain|tenerife|güímar|guimar)/i.test(`${text} ${city}`)) {
    return "Spagna";
  }
  if (/(italia|italy)/i.test(text)) return "Italia";
  if (city && !["Tenerife", "Güímar", "Guimar"].includes(city)) return "Italia";
  return "";
}

function toPropertyType(value: string): PropertyType | null {
  const normalized = value.toLocaleLowerCase("it-IT");
  if (/(appartamento|attico|loft|monolocale)/.test(normalized)) return "apartment";
  if (/(villa|casa|villetta)/.test(normalized)) return "house";
  if (/(locale|ufficio|negozio|magazzino)/.test(normalized)) return "commercial";
  if (/(terreno|appezzamento)/.test(normalized)) return "land";
  if (/(garage|box|posto auto)/.test(normalized)) return "garage";
  return null;
}

function fieldCount(draft: PropertyDraft) {
  return [draft.objective, draft.propertyType, draft.country, draft.city, draft.surface, draft.condition].filter(Boolean).length;
}

function nextQuestion(draft: PropertyDraft) {
  if (!draft.objective) return "Qual è il tuo obiettivo principale: vendere, affittare, valutare oppure gestire l’immobile?";
  if (draft.objective === "Affitto" && !draft.operationType) {
    return "Che tipo di affitto vuoi gestire: lungo termine, transitorio, per studenti oppure turistico breve?";
  }
  if (!draft.propertyType) return "Di che tipo di immobile si tratta? Per esempio appartamento, villa, casa indipendente, terreno o locale.";
  if (!draft.city) return "In quale comune si trova l’immobile?";
  if (!draft.country) return "In quale Paese si trova l’immobile?";
  if (!draft.surface) return "Conosci indicativamente la superficie in metri quadrati? Puoi anche dirmi che non la sai ancora.";
  if (!draft.condition) return "Come descriveresti lo stato dell’immobile: da ristrutturare, buono, ristrutturato o nuovo?";
  return "Ho preparato una prima bozza. Controllala a destra: puoi correggere ogni dato prima di confermarla.";
}

function firstMissingField(draft: PropertyDraft): keyof PropertyDraft | null {
  if (!draft.objective) return "objective";
  if (draft.objective === "Affitto" && !draft.operationType) return "operationType";
  if (!draft.propertyType) return "propertyType";
  if (!draft.city) return "city";
  if (!draft.country) return "country";
  if (!draft.surface) return "surface";
  if (!draft.condition) return "condition";
  return null;
}

function normalizeDirectAnswer(field: keyof PropertyDraft, text: string) {
  if (field === "surface" && /non (lo )?so|non conosco/i.test(text)) return "Da verificare";
  return text.trim();
}

async function brainReply(
  draft: PropertyDraft,
  customerMessage: string,
  history: ChatMessage[],
): Promise<{
  text: string;
  decision: SiteOrchestrationResponse | null;
  engine: "OPENAI" | "CACHE" | "DETERMINISTIC" | "LOCAL";
}> {
  const localQuestion = nextQuestion(draft);
  if (firstMissingField(draft)) {
    return { text: localQuestion, decision: null, engine: "LOCAL" };
  }

  const caseRequest: SiteOrchestrationRequest = {
    caseId: draft.id,
    operationType: draft.operationType ?? null,
    customerRole: draft.customerRole ?? "UNCONFIRMED",
    property: {
      id: draft.id,
      type: draft.propertyType,
      country: draft.country,
      city: draft.city,
      province: draft.province,
      address: draft.address,
      locationVerified: false,
      documents: [],
    },
    progress: { currentPhase: "INTAKE" },
  };

  if (draft.operationType) {
    try {
      const result = await requestGuimmiaBrain({
        question:
          customerMessage.trim() ||
          draft.notes.trim() ||
          "Qual è il prossimo passo sicuro per questa pratica?",
        requestKind: classifyGuimmiaBrainRequest(customerMessage),
        case: { ...caseRequest, operationType: draft.operationType },
        conversation: history.slice(-4).map((message) => ({
          role: message.sender === "user" ? "user" : "assistant",
          text: message.text,
        })),
      });

      return {
        text: formatGuimmiaBrainAnswer(result),
        decision: result.orchestration,
        engine: result.cacheHit ? "CACHE" : "OPENAI",
      };
    } catch {
      // OpenAI is an assistive layer: deterministic Guimmia remains available.
    }
  }

  try {
    const decision = await requestSiteOrchestration(caseRequest);
    const question = decision.customerQuestions[0];

    return {
      text:
        question?.prompt ||
        decision.customerExplanation ||
        localQuestion,
      decision,
      engine: "DETERMINISTIC",
    };
  } catch {
    return { text: localQuestion, decision: null, engine: "LOCAL" };
  }
}

export default function PilotFirstChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [draft, setDraft] = useState<PropertyDraft>(emptyDraft);
  const [input, setInput] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [brainDecision, setBrainDecision] = useState<SiteOrchestrationResponse | null>(null);
  const [thinking, setThinking] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const initialQueryHandledRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { messages?: ChatMessage[]; draft?: PropertyDraft };
          if (parsed.messages?.length) setMessages(parsed.messages);
          if (parsed.draft) setDraft(parsed.draft);
        }
      } catch {
        // A damaged local demo session must not block Guimmia.
      } finally {
        setLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, draft }));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draft, loaded]);

  useEffect(() => {
    if (!loaded || initialQueryHandledRef.current) return;

    initialQueryHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const initialMessageFromHome = params.get("message")?.trim();

    if (!initialMessageFromHome) return;

    const expectedField = firstMissingField(draft);
    const detected: Partial<PropertyDraft> = {
      objective: draft.objective || detectObjective(initialMessageFromHome),
      propertyType:
        draft.propertyType || detectPropertyType(initialMessageFromHome),
      city: draft.city || detectCity(initialMessageFromHome),
      surface: draft.surface || detectSurface(initialMessageFromHome),
      rooms: draft.rooms || detectRooms(initialMessageFromHome),
      operationType:
        draft.operationType ||
        detectGuimmiaOperationType(initialMessageFromHome) ||
        undefined,
      customerRole:
        draft.customerRole && draft.customerRole !== "UNCONFIRMED"
          ? draft.customerRole
          : detectCustomerRole(initialMessageFromHome),
    };
    detected.country =
      draft.country ||
      detectCountry(initialMessageFromHome, detected.city ?? draft.city);

    const updated: PropertyDraft = {
      ...draft,
      ...detected,
      updatedAt: new Date().toISOString(),
      status: "draft",
    };

    if (
      expectedField &&
      expectedField !== "operationType" &&
      !String(updated[expectedField] ?? "").trim()
    ) {
      Object.assign(updated, {
        [expectedField]: normalizeDirectAnswer(
          expectedField,
          initialMessageFromHome,
        ),
      });
    }

    const timer = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `user_home_${Date.now()}`,
          sender: "user",
          text: initialMessageFromHome,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDraft(updated);
      setThinking(true);

      void brainReply(updated, initialMessageFromHome, messages)
        .then(({ text, decision, engine }) => {
          setBrainDecision(decision);
          setMessages((current) => [
            ...current,
            {
              id: `pilot_home_${Date.now()}`,
              sender: "pilot",
              text,
              createdAt: new Date().toISOString(),
              engine,
            },
          ]);
        })
        .finally(() => setThinking(false));

      window.history.replaceState({}, "", window.location.pathname);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loaded, draft, messages]);

  const completeness = useMemo(
    () => Math.min(100, Math.round((fieldCount(draft) / 6) * 100)),
    [draft],
  );

  const addMessage = (sender: ChatMessage["sender"], text: string) => {
    setMessages((current) => [
      ...current,
      { id: `${sender}_${Date.now()}_${Math.random()}`, sender, text, createdAt: new Date().toISOString() },
    ]);
  };

  const processMessage = (text: string) => {
    const expectedField = firstMissingField(draft);
    const detected: Partial<PropertyDraft> = {
      objective: draft.objective || detectObjective(text),
      propertyType: draft.propertyType || detectPropertyType(text),
      city: draft.city || detectCity(text),
      surface: draft.surface || detectSurface(text),
      rooms: draft.rooms || detectRooms(text),
      operationType:
        draft.operationType || detectGuimmiaOperationType(text) || undefined,
      customerRole:
        draft.customerRole && draft.customerRole !== "UNCONFIRMED"
          ? draft.customerRole
          : detectCustomerRole(text),
    };
    detected.country = draft.country || detectCountry(text, detected.city ?? draft.city);

    const updated: PropertyDraft = {
      ...draft,
      ...detected,
      updatedAt: new Date().toISOString(),
      status: "draft",
    };

    if (
      expectedField &&
      expectedField !== "operationType" &&
      !String(updated[expectedField] ?? "").trim()
    ) {
      const directAnswer = normalizeDirectAnswer(expectedField, text);
      Object.assign(updated, { [expectedField]: directAnswer });
    }

    if (!expectedField) {
      updated.notes = [draft.notes, text.trim()].filter(Boolean).join("\n");
    }

    setDraft(updated);
    setThinking(true);
    window.setTimeout(() => {
      void brainReply(updated, text, messages)
        .then(({ text: reply, decision, engine }) => {
          setBrainDecision(decision);
          setMessages((current) => [
            ...current,
            {
              id: `pilot_${Date.now()}_${Math.random()}`,
              sender: "pilot",
              text: reply,
              createdAt: new Date().toISOString(),
              engine,
            },
          ]);
        })
        .finally(() => setThinking(false));
    }, 250);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || thinking) return;
    addMessage("user", value);
    setInput("");
    setSavedNotice("");
    processMessage(value);
  };

  const handlePrompt = (prompt: string) => {
    if (thinking) return;
    addMessage("user", prompt);
    processMessage(prompt);
  };

  const updateDraft = (field: keyof PropertyDraft, value: string) => {
    setDraft((current) => {
      const next = { ...current, [field]: value, status: "draft" as const, updatedAt: new Date().toISOString() };
      if (field === "objective") {
        next.operationType = detectGuimmiaOperationType(value) || undefined;
        if (hasGenericRentalIntent(value) && !next.operationType) {
          next.objective = "Affitto";
        }
      }
      return next;
    });
    setSavedNotice("");
  };

  const saveDraft = () => {
    if (draft.destinationHref) {
      router.push(draft.destinationHref);
      return;
    }
    if (draft.journeyId) {
      router.push(`/dashboard?created=${draft.journeyId}`);
      return;
    }
    if (!draft.operationType) {
      setSavedNotice("Specifica prima il tipo di operazione immobiliare.");
      return;
    }
    if (["BUYER", "TENANT", "GUEST"].includes(draft.customerRole ?? "")) {
      const confirmed = {
        ...draft,
        destinationHref: "/immobili",
        status: "confirmed" as const,
        updatedAt: new Date().toISOString(),
      };
      setDraft(confirmed);
      setSavedNotice("Richiesta preparata. Ora puoi consultare gli immobili disponibili.");
      addMessage(
        "pilot",
        "Ho riconosciuto che stai cercando un immobile. Ti porto nella vetrina Guimmia: da ogni annuncio potrai chiedere informazioni o proporre una visita.",
      );
      return;
    }
    const propertyType = toPropertyType(draft.propertyType);
    if (!propertyType) {
      setSavedNotice("Controlla il tipo di immobile prima di creare il percorso.");
      return;
    }

    const journey = createJourney({
      ...INITIAL_WIZARD_DATA,
      operation: toSiteOperationType(draft.operationType),
      propertyType,
      propertyName: `${draft.propertyType} a ${draft.city}`,
      surface: draft.surface.replace(/[^0-9.,]/g, "").replace(",", "."),
      country: draft.country,
      city: draft.city,
      province: draft.province,
      address: draft.address,
    });
    const confirmed = {
      ...draft,
      journeyId: journey.id,
      status: "confirmed" as const,
      updatedAt: new Date().toISOString(),
    };
    setDraft(confirmed);
    try {
      const current = JSON.parse(window.localStorage.getItem(PROPERTY_STORAGE_KEY) || "[]") as PropertyDraft[];
      const next = [...current.filter((item) => item.id !== confirmed.id), confirmed];
      window.localStorage.setItem(PROPERTY_STORAGE_KEY, JSON.stringify(next));
      setSavedNotice("Pratica creata. Ora puoi aprire il percorso orchestrato da Guimmia.");
      addMessage("pilot", "Perfetto. Ho creato la pratica e collegato il percorso al cervello di Guimmia. Nella dashboard vedrai il primo passo adatto a questa operazione.");
    } catch {
      setSavedNotice("Non è stato possibile salvare la scheda nel browser.");
    }
  };

  const restart = () => {
    const fresh = emptyDraft();
    setDraft(fresh);
    setMessages([{ ...initialMessage, id: `pilot_welcome_${Date.now()}` }]);
    setBrainDecision(null);
    setThinking(false);
    setSavedNotice("");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm"><CompassIcon className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Guimmia</h1>
                <p className="text-sm text-slate-500"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />La tua guida immobiliare intelligente</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={restart} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Nuova conversazione</button>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Dashboard</Link>
          </div>
        </div>

        <div className="grid min-h-[720px] gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="font-semibold">Raccontami liberamente cosa vuoi fare</p>
              <p className="mt-1 text-sm text-slate-500">Guimmia raccoglie i dati nel dialogo e prepara la bozza senza obbligarti a compilare un modulo iniziale.</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[72%] ${message.sender === "user" ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-800"}`}>
                    {message.text}
                    {message.sender === "pilot" && message.engine ? (
                      <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                        {message.engine === "OPENAI"
                          ? "Cervello Guimmia + OpenAI"
                          : message.engine === "CACHE"
                            ? "Risposta riutilizzata · nessun nuovo costo"
                            : message.engine === "DETERMINISTIC"
                              ? "Percorso sicuro Guimmia · OpenAI non utilizzato"
                              : "Raccolta dati locale · nessun costo IA"}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {thinking ? (
                <div className="flex justify-start" aria-live="polite">
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    Guimmia sta consultando il percorso e le regole della pratica…
                  </div>
                </div>
              ) : null}
              <div ref={chatEndRef} />
            </div>

            {messages.length <= 2 ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">
                {["Voglio vendere una casa ad Acireale", "Vorrei affittare il mio appartamento", "Ho bisogno di capire quanto vale il mio immobile"].map((prompt) => (
                  <button key={prompt} type="button" disabled={thinking} onClick={() => handlePrompt(prompt)} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">{prompt}</button>
                ))}
              </div>
            ) : null}

            <form onSubmit={submit} className="border-t border-slate-100 p-4 sm:p-5">
              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                <textarea value={input} disabled={thinking} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Scrivi qui il tuo messaggio..." rows={2} className="min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none disabled:cursor-wait" />
                <button type="submit" disabled={!input.trim() || thinking} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Invia messaggio">
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true"><path d="m3 3 14 7-14 7 2.8-7L3 3Z" fill="currentColor" /><path d="M6 10h7" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Bozza preparata da Guimmia</p>
                <h2 className="mt-2 text-xl font-semibold">Scheda immobile</h2>
                <p className="mt-1 text-sm text-slate-500">Correggi liberamente i dati prima di confermare.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{draft.status === "confirmed" ? "Confermata" : "Bozza"}</span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500"><span>Completezza</span><span>{completeness}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${completeness}%` }} /></div>
            </div>

            {(draft.operationType || brainDecision) && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">Percorso Guimmia</p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {draft.operationType
                    ? OPERATION_LABELS[draft.operationType]
                    : brainDecision?.operationLabel}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Il cervello usa questo percorso per ordinare domande, documenti e passaggi successivi.
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4">
              {[
                ["objective", "Obiettivo", "Vendita, affitto, valutazione..."],
                ["propertyType", "Tipo di immobile", "Appartamento, villa..."],
                ["country", "Paese", "Italia, Spagna..."],
                ["city", "Comune", "Comune"],
                ["province", "Provincia", "Sigla o provincia"],
                ["address", "Indirizzo", "Facoltativo in questa fase"],
                ["surface", "Superficie", "Per esempio 120 m²"],
                ["rooms", "Vani o camere", "Per esempio 4"],
                ["condition", "Stato", "Buono, da ristrutturare..."],
                ["occupancy", "Disponibilità", "Libero, occupato..."],
              ].map(([field, label, placeholder]) => (
                <label key={field} className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  {label}
                  <input value={String(draft[field as keyof PropertyDraft] ?? "")} onChange={(event) => updateDraft(field as keyof PropertyDraft, event.target.value)} placeholder={placeholder} className="min-h-11 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                </label>
              ))}
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Note
                <textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} rows={4} placeholder="Dettagli aggiuntivi raccolti nella conversazione" className="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
              </label>
            </div>

            <button type="button" onClick={saveDraft} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
              {draft.destinationHref
                ? "Vedi gli immobili Guimmia"
                : draft.journeyId
                  ? "Apri il percorso Guimmia"
                  : "Conferma e crea il percorso"}
            </button>
            {savedNotice ? <p className={`mt-3 text-center text-sm font-semibold ${savedNotice.startsWith("Scheda") ? "text-emerald-700" : "text-red-600"}`}>{savedNotice}</p> : null}
            <p className="mt-4 text-xs leading-5 text-slate-500">Guimmia può interpretare male un dettaglio. Per questo nessun dato diventa definitivo senza il tuo controllo.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
