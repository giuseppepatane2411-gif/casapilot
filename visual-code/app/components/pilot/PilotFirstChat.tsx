"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import GuimmiaAgendaWorkspace from "@/components/guimmia/GuimmiaAgendaWorkspace";
import GuimmiaDocumentWorkspace from "@/components/guimmia/GuimmiaDocumentWorkspace";
import GuimmiaLivingCaseRoom from "@/components/guimmia/GuimmiaLivingCaseRoom";
import GuidedAddressSearch, {
  type GuidedAddressValue,
} from "@/components/property-wizard/GuidedAddressSearch";
import {
  GUIMMIA_CONDITION_OPTIONS,
  GUIMMIA_COUNTRY_OPTIONS,
  GUIMMIA_OBJECTIVE_OPTIONS,
  GUIMMIA_OCCUPANCY_OPTIONS,
  GUIMMIA_PROPERTY_TYPE_OPTIONS,
  GUIMMIA_RENTAL_OPTIONS,
  isRentalObjective,
  objectiveOption,
} from "@/lib/guimmia/intake/options";
import {
  classifyGuimmiaBrainRequest,
  formatGuimmiaBrainAnswer,
  requestGuimmiaBrain,
} from "@/lib/guimmia/openai/brain-client";
import { requestGuimmiaIntake } from "@/lib/guimmia/openai/intake-client";
import type {
  GuimmiaIntakeDraft,
  GuimmiaIntakePatch,
} from "@/lib/guimmia/openai/intake-types";
import { analyzeGuimmiaDocument } from "@/lib/guimmia/operations/document-client";
import type {
  GuimmiaActionReceipt,
  GuimmiaCaseRoomPanel,
} from "@/lib/guimmia/operations/case-room-types";
import {
  interpretGuimmiaSchedule,
  looksLikeGuimmiaSchedulingMessage,
} from "@/lib/guimmia/operations/scheduling-client";
import type { GuimmiaScheduleProposal } from "@/lib/guimmia/operations/scheduling-types";
import { requestSiteOrchestration } from "@/lib/guimmia/site-orchestration/client";
import {
  OPERATION_LABELS,
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
  engine?: "OPENAI" | "CACHE" | "INTAKE" | "DETERMINISTIC" | "LOCAL";
  receipt?: GuimmiaActionReceipt;
};

type WorkspacePanel = GuimmiaCaseRoomPanel;

type PropertyDraft = {
  id: string;
  objective: string;
  propertyType: string;
  country: string;
  city: string;
  province: string;
  address: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  locationVerified: boolean;
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
  postalCode: "",
  latitude: null,
  longitude: null,
  locationVerified: false,
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
  text: "Ciao, sono Guimmia. Raccontami in una sola frase cosa vuoi fare con il tuo immobile. Io aprirò la pratica, organizzerò quello che mi dici e ti mostrerò la prima mossa utile.",
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

function toPropertyType(value: string): PropertyType | null {
  const normalized = value.toLocaleLowerCase("it-IT");
  if (/(stanza|camera|posto letto)/.test(normalized)) return "room";
  if (/(appartamento|attico|loft|monolocale)/.test(normalized)) return "apartment";
  if (/(villa|casa|villetta)/.test(normalized)) return "house";
  if (/(locale|ufficio|negozio|magazzino)/.test(normalized)) return "commercial";
  if (/(terreno|appezzamento)/.test(normalized)) return "land";
  if (/(garage|box|posto auto)/.test(normalized)) return "garage";
  return null;
}

function fieldCount(draft: PropertyDraft) {
  return [
    draft.objective,
    draft.operationType,
    draft.propertyType,
    draft.country,
    draft.city,
    draft.locationVerified ? "verified" : "",
    draft.surface,
    draft.condition,
  ].filter(Boolean).length;
}

function nextQuestion(draft: PropertyDraft) {
  if (!draft.objective) return "Qual è il tuo obiettivo principale: vendere, affittare, valutare oppure gestire l’immobile?";
  if (isRentalObjective(draft.objective) && !draft.operationType) {
    return "Che tipo di affitto vuoi gestire: lungo termine, transitorio, per studenti oppure turistico breve?";
  }
  if (!draft.propertyType) return "Di che tipo di immobile si tratta? Per esempio appartamento, villa, stanza, casa indipendente, terreno o locale.";
  if (!draft.city) return "In quale comune si trova l’immobile?";
  if (!draft.country) return "In quale Paese si trova l’immobile?";
  if (!draft.locationVerified) return "Controlla la località suggerita nella scheda e conferma la posizione dell’immobile.";
  if (!draft.surface) return "Conosci indicativamente la superficie in metri quadrati? Puoi anche dirmi che non la sai ancora.";
  if (!draft.condition) return "Come descriveresti lo stato dell’immobile: da ristrutturare, buono, ristrutturato o nuovo?";
  return "Ho preparato una prima bozza. Controllala a destra: puoi correggere ogni dato prima di confermarla.";
}

function firstMissingField(draft: PropertyDraft): keyof PropertyDraft | null {
  if (!draft.objective) return "objective";
  if (isRentalObjective(draft.objective) && !draft.operationType) return "operationType";
  if (!draft.propertyType) return "propertyType";
  if (!draft.city) return "city";
  if (!draft.country) return "country";
  if (!draft.locationVerified) return "locationVerified";
  if (!draft.surface) return "surface";
  if (!draft.condition) return "condition";
  return null;
}

const INTAKE_FIELD_LABELS: Partial<Record<keyof GuimmiaIntakePatch, string>> = {
  objective: "Obiettivo della pratica",
  operationType: "Percorso immobiliare",
  customerRole: "Ruolo del cliente",
  propertyType: "Tipo di immobile",
  country: "Paese",
  city: "Comune",
  province: "Provincia",
  address: "Indirizzo",
  postalCode: "CAP",
  surfaceSqm: "Superficie",
  rooms: "Vani o camere",
  condition: "Stato dell’immobile",
  occupancy: "Disponibilità dell’immobile",
  notes: "Note della pratica",
};

function intakeReceipt(patch: GuimmiaIntakePatch): GuimmiaActionReceipt | undefined {
  const items = Object.entries(patch)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([field]) => INTAKE_FIELD_LABELS[field as keyof GuimmiaIntakePatch])
    .filter((label): label is string => Boolean(label));
  if (items.length === 0) return undefined;
  return {
    title: "Ho aggiornato la pratica",
    items: Array.from(new Set(items)).slice(0, 6),
    targetPanel: "CASE_ROOM",
    requiresConfirmation: true,
  };
}

function toIntakeDraft(draft: PropertyDraft): GuimmiaIntakeDraft {
  const surfaceSqm = Number(
    draft.surface.replace(/[^0-9.,]/g, "").replace(",", "."),
  );
  const rooms = Number(draft.rooms.replace(/\D/g, ""));
  return {
    id: draft.id,
    objective: draft.objective,
    operationType: draft.operationType ?? null,
    customerRole: draft.customerRole ?? "UNCONFIRMED",
    propertyType: draft.propertyType,
    country: draft.country,
    city: draft.city,
    province: draft.province,
    address: draft.address,
    postalCode: draft.postalCode,
    surfaceSqm: Number.isFinite(surfaceSqm) && surfaceSqm > 0 ? surfaceSqm : null,
    rooms: Number.isInteger(rooms) && rooms > 0 ? rooms : null,
    condition: draft.condition,
    occupancy: draft.occupancy,
    notes: draft.notes,
    locationVerified: draft.locationVerified,
  };
}

function applyIntakePatch(
  draft: PropertyDraft,
  patch: GuimmiaIntakePatch,
): PropertyDraft {
  const locationChanged = ["country", "city", "province", "address", "postalCode"].some(
    (field) => {
      const value = patch[field as keyof GuimmiaIntakePatch];
      return value !== undefined && value !== draft[field as keyof PropertyDraft];
    },
  );
  return {
    ...draft,
    ...(patch.objective !== undefined ? { objective: patch.objective } : {}),
    ...(patch.operationType !== undefined
      ? { operationType: patch.operationType ?? undefined }
      : {}),
    ...(patch.customerRole !== undefined
      ? { customerRole: patch.customerRole }
      : {}),
    ...(patch.propertyType !== undefined ? { propertyType: patch.propertyType } : {}),
    ...(patch.country !== undefined ? { country: patch.country } : {}),
    ...(patch.city !== undefined ? { city: patch.city } : {}),
    ...(patch.province !== undefined ? { province: patch.province } : {}),
    ...(patch.address !== undefined ? { address: patch.address } : {}),
    ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode } : {}),
    ...(patch.surfaceSqm !== undefined && patch.surfaceSqm !== null
      ? { surface: String(patch.surfaceSqm) }
      : {}),
    ...(patch.rooms !== undefined && patch.rooms !== null
      ? { rooms: String(patch.rooms) }
      : {}),
    ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
    ...(patch.occupancy !== undefined ? { occupancy: patch.occupancy } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    locationVerified: locationChanged ? false : draft.locationVerified,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}

async function brainReply(
  draft: PropertyDraft,
  customerMessage: string,
  history: ChatMessage[],
): Promise<{
  text: string;
  decision: SiteOrchestrationResponse | null;
  engine: "OPENAI" | "CACHE" | "DETERMINISTIC" | "LOCAL";
  receipt?: GuimmiaActionReceipt;
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
      locationVerified: draft.locationVerified,
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
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentRefreshToken, setDocumentRefreshToken] = useState(0);
  const [caseRoomRefreshToken, setCaseRoomRefreshToken] = useState(0);
  const [workspacePanel, setWorkspacePanel] = useState<WorkspacePanel>("CASE_ROOM");
  const [scheduleProposal, setScheduleProposal] = useState<GuimmiaScheduleProposal | null>(null);
  const [loaded, setLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialQueryHandledRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { messages?: ChatMessage[]; draft?: PropertyDraft };
          if (parsed.messages?.length) setMessages(parsed.messages);
          if (parsed.draft) {
            setDraft({
              ...emptyDraft(),
              ...parsed.draft,
              objective:
                parsed.draft.objective === "Affitto"
                  ? "Affittare"
                  : parsed.draft.objective,
              postalCode: parsed.draft.postalCode ?? "",
              latitude: parsed.draft.latitude ?? null,
              longitude: parsed.draft.longitude ?? null,
              locationVerified: parsed.draft.locationVerified === true,
            });
          }
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
      setThinking(true);
      void requestGuimmiaIntake({
        message: initialMessageFromHome,
        draft: toIntakeDraft(draft),
        conversation: [],
      })
        .then((result) => {
          setDraft((current) => applyIntakePatch(current, result.patch));
          setCaseRoomRefreshToken((current) => current + 1);
          setQuickReplies(result.quickReplies);
          setMessages((current) => [
            ...current,
            {
              id: `pilot_home_${Date.now()}`,
              sender: "pilot",
              text: result.assistantMessage,
              createdAt: new Date().toISOString(),
              engine: result.cacheHit ? "CACHE" : "INTAKE",
              receipt: intakeReceipt(result.patch),
            },
          ]);
        })
        .catch(() => {
          setMessages((current) => [
            ...current,
            {
              id: `pilot_home_fallback_${Date.now()}`,
              sender: "pilot",
              text: "Non sono riuscita a interpretare il messaggio. Riprova descrivendo obiettivo, immobile e località.",
              createdAt: new Date().toISOString(),
              engine: "LOCAL",
            },
          ]);
        })
        .finally(() => setThinking(false));

      window.history.replaceState({}, "", window.location.pathname);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loaded, draft, messages]);

  const completeness = useMemo(
    () => Math.min(100, Math.round((fieldCount(draft) / 8) * 100)),
    [draft],
  );

  const addMessage = (sender: ChatMessage["sender"], text: string) => {
    setMessages((current) => [
      ...current,
      { id: `${sender}_${Date.now()}_${Math.random()}`, sender, text, createdAt: new Date().toISOString() },
    ]);
  };

  const processMessage = (text: string) => {
    const needsIntake = draft.status !== "confirmed";
    const schedulingMessage = looksLikeGuimmiaSchedulingMessage(text);
    setThinking(true);
    setQuickReplies([]);
    window.setTimeout(() => {
      const task = schedulingMessage
        ? interpretGuimmiaSchedule({
            message: text,
            draftId: draft.id,
            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome",
          }).then((result) => {
            if (result.proposal.intent !== "NONE") {
              setScheduleProposal(result.proposal);
              setWorkspacePanel("AGENDA");
            }
            return {
              text: result.proposal.assistantMessage,
              decision: null,
              engine: "OPENAI" as const,
              receipt: result.proposal.intent !== "NONE"
                ? {
                    title: "Ho preparato una proposta in agenda",
                    items: [
                      result.proposal.intent === "DECLARE_AVAILABILITY"
                        ? "Fascia di disponibilità letta"
                        : "Richiesta di appuntamento letta",
                      "Nessuna prenotazione eseguita",
                    ],
                    targetPanel: "AGENDA" as const,
                    requiresConfirmation: true,
                  }
                : undefined,
            };
          })
        : needsIntake
        ? requestGuimmiaIntake({
            message: text,
            draft: toIntakeDraft(draft),
            conversation: messages.slice(-6).map((message) => ({
              role:
                message.sender === "user"
                  ? "user" as const
                  : "assistant" as const,
              text: message.text,
            })),
          }).then((result) => {
            setDraft((current) => applyIntakePatch(current, result.patch));
            setCaseRoomRefreshToken((current) => current + 1);
            setQuickReplies(result.quickReplies);
            return {
              text: result.assistantMessage,
              decision: null,
              engine: result.cacheHit ? "CACHE" as const : "INTAKE" as const,
              receipt: intakeReceipt(result.patch),
            };
          })
        : brainReply(draft, text, messages);

      void task
        .then(({ text: reply, decision, engine, receipt }) => {
          if (decision) setBrainDecision(decision);
          setMessages((current) => [
            ...current,
            {
              id: `pilot_${Date.now()}_${Math.random()}`,
              sender: "pilot",
              text: reply,
              createdAt: new Date().toISOString(),
              engine,
              receipt,
            },
          ]);
        })
        .catch(() => {
          setMessages((current) => [
            ...current,
            {
              id: `pilot_fallback_${Date.now()}_${Math.random()}`,
              sender: "pilot",
              text: needsIntake
                ? "Non sono riuscita a leggere il messaggio. Riprova con una frase semplice oppure usa le scelte nella scheda."
                : "Il collegamento intelligente non ha risposto. Il percorso sicuro di Guimmia resta disponibile.",
              createdAt: new Date().toISOString(),
              engine: "LOCAL",
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

  const handleDocumentSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || documentUploading) return;
    addMessage("user", `Ho caricato il documento “${file.name}”. Organizzalo nella pratica.`);
    setDocumentUploading(true);
    setWorkspacePanel("DOCUMENTS");
    setSavedNotice("");
    try {
      const result = await analyzeGuimmiaDocument(file, draft.id);
      setDocumentRefreshToken((current) => current + 1);
      setCaseRoomRefreshToken((current) => current + 1);
      setMessages((current) => [
        ...current,
        {
          id: `pilot_document_${Date.now()}_${Math.random()}`,
          sender: "pilot",
          text: `${result.assistantMessage}\n\nControlla cartella e destinatari nel pannello Documenti, poi conferma. Non ho inviato il file a nessuno.`,
          createdAt: new Date().toISOString(),
          engine: "OPENAI",
          receipt: {
            title: "Ho preparato il documento",
            items: [
              `Nome proposto: ${result.document.suggestedName}`,
              "Cartella e destinatari suggeriti",
              "Invio bloccato fino alla conferma",
            ],
            targetPanel: "DOCUMENTS",
            requiresConfirmation: true,
          },
        },
      ]);
    } catch (cause) {
      setMessages((current) => [
        ...current,
        {
          id: `pilot_document_error_${Date.now()}_${Math.random()}`,
          sender: "pilot",
          text:
            cause instanceof Error
              ? cause.message
              : "Non sono riuscita a leggere il documento. Il file non è stato archiviato.",
          createdAt: new Date().toISOString(),
          engine: "LOCAL",
        },
      ]);
    } finally {
      setDocumentUploading(false);
    }
  };

  const updateDraft = (field: keyof PropertyDraft, value: string) => {
    setDraft((current) => {
      const next = { ...current, [field]: value, status: "draft" as const, updatedAt: new Date().toISOString() };
      if (field === "objective") {
        const option = objectiveOption(value);
        next.operationType = option?.operationType ?? undefined;
        next.customerRole = option?.customerRole ?? "UNCONFIRMED";
      }
      return next;
    });
    setQuickReplies([]);
    setSavedNotice("");
  };

  const updateOperationType = (value: string) => {
    const operationType = GUIMMIA_RENTAL_OPTIONS.find(
      (option) => option.value === value,
    )?.value;
    setDraft((current) => ({
      ...current,
      operationType,
      status: "draft",
      updatedAt: new Date().toISOString(),
    }));
    setQuickReplies([]);
    setSavedNotice("");
  };

  const updateAddress = (
    value: GuidedAddressValue,
    source: "municipality" | "address" | "postcode" | "manual",
  ) => {
    void source;
    setDraft((current) => ({
      ...current,
      country: value.country,
      city: value.city,
      province: value.province,
      postalCode: value.postalCode,
      address: value.address,
      latitude: value.latitude,
      longitude: value.longitude,
      locationVerified: false,
      status: "draft",
      updatedAt: new Date().toISOString(),
    }));
    setSavedNotice("");
  };

  const confirmLocation = () => {
    if (!draft.city) {
      setSavedNotice("Seleziona prima il Comune dai suggerimenti.");
      return;
    }
    setDraft((current) => ({
      ...current,
      locationVerified: true,
      status: "draft",
      updatedAt: new Date().toISOString(),
    }));
    setQuickReplies([]);
    setSavedNotice("Posizione confermata. La scheda resta una bozza finché non la approvi.");
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
    const missing = firstMissingField(draft);
    if (missing) {
      setSavedNotice(nextQuestion(draft));
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
    setQuickReplies([]);
    setThinking(false);
    setDocumentUploading(false);
    setDocumentRefreshToken(0);
    setCaseRoomRefreshToken(0);
    setWorkspacePanel("CASE_ROOM");
    setScheduleProposal(null);
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

        <div className="grid min-h-[720px] gap-5 lg:grid-cols-[minmax(0,1fr)_440px]">
          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="font-semibold">La pratica nasce dalla conversazione</p>
              <p className="mt-1 text-sm text-slate-500">Parla normalmente: Guimmia trasforma parole e documenti in una pratica ordinata, sempre sotto il tuo controllo.</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[72%] ${message.sender === "user" ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-800"}`}>
                    {message.text}
                    {message.sender === "pilot" && message.receipt ? (
                      <button
                        type="button"
                        onClick={() => message.receipt?.targetPanel && setWorkspacePanel(message.receipt.targetPanel)}
                        className="mt-3 block w-full rounded-xl border border-blue-200 bg-white p-3 text-left shadow-sm"
                      >
                        <span className="flex items-center justify-between gap-2 text-[11px] font-bold text-blue-700">
                          <span>✓ {message.receipt.title}</span>
                          {message.receipt.requiresConfirmation ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-800">Da controllare</span> : null}
                        </span>
                        <span className="mt-2 block space-y-1 text-[11px] leading-4 text-slate-600">
                          {message.receipt.items.map((item) => <span key={item} className="block">• {item}</span>)}
                        </span>
                        {message.receipt.targetPanel ? <span className="mt-2 block text-[10px] font-bold text-blue-600">Apri il risultato →</span> : null}
                      </button>
                    ) : null}
                    {message.sender === "pilot" && message.engine ? (
                      <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                        {message.engine === "OPENAI"
                          ? "Cervello Guimmia + OpenAI"
                          : message.engine === "CACHE"
                            ? "Risposta riutilizzata · nessun nuovo costo"
                            : message.engine === "INTAKE"
                              ? "Scheda aggiornata da Guimmia + OpenAI"
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

            <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Comandi rapidi della pratica</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  ["Cosa manca?", "Controlla l’intera pratica e dimmi cosa manca, in ordine di priorità."],
                  ["Prossima mossa", "Qual è la prossima mossa più utile e sicura per questa pratica?"],
                  ["Fascicolo notaio", "Controlla quali documenti sono già pronti per il notaio e quali mancano."],
                  ["Organizza visita", "Aiutami a organizzare una visita usando soltanto le disponibilità del proprietario."],
                ].map(([label, prompt]) => (
                  <button key={label} type="button" disabled={thinking} onClick={() => handlePrompt(prompt)} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50">{label}</button>
                ))}
                <button type="button" disabled={thinking || documentUploading} onClick={() => fileInputRef.current?.click()} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50">Carica documento</button>
              </div>
            </div>

            {quickReplies.length > 0 || messages.length <= 2 ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">
                {(quickReplies.length > 0
                  ? quickReplies
                  : [
                      "Voglio vendere un appartamento di 110 m² a Modena, in buono stato",
                      "Vorrei affittare il mio appartamento",
                      "Ho bisogno di capire quanto vale il mio immobile",
                    ]
                ).map((prompt) => (
                  <button key={prompt} type="button" disabled={thinking} onClick={() => handlePrompt(prompt)} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">{prompt}</button>
                ))}
              </div>
            ) : null}

            <form onSubmit={submit} className="border-t border-slate-100 p-4 sm:p-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={(event) => void handleDocumentSelected(event)}
              />
              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                <button
                  type="button"
                  disabled={thinking || documentUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                  aria-label="Carica un documento nella chat"
                  title="Carica documento"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M8.5 12.5 14 7a3 3 0 0 1 4.2 4.2l-7.1 7.1a5 5 0 0 1-7.1-7.1L11.2 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <textarea value={input} disabled={thinking} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Scrivi qui il tuo messaggio..." rows={2} className="min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none disabled:cursor-wait" />
                <button type="submit" disabled={!input.trim() || thinking} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Invia messaggio">
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true"><path d="m3 3 14 7-14 7 2.8-7L3 3Z" fill="currentColor" /><path d="M6 10h7" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
              {([
                ["CASE_ROOM", "Pratica"],
                ["PROPERTY", "Scheda"],
                ["DOCUMENTS", "Documenti"],
                ["AGENDA", "Agenda"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWorkspacePanel(value)}
                  className={`rounded-xl px-2 py-2 text-xs font-bold transition ${workspacePanel === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {workspacePanel === "CASE_ROOM" ? (
              <GuimmiaLivingCaseRoom
                draft={draft}
                refreshToken={caseRoomRefreshToken}
                onOpenPanel={setWorkspacePanel}
                onPrompt={handlePrompt}
                onUploadDocument={() => fileInputRef.current?.click()}
              />
            ) : workspacePanel === "PROPERTY" ? (
            <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Bozza preparata da Guimmia</p>
                <h2 className="mt-2 text-xl font-semibold">Scheda immobile</h2>
                <p className="mt-1 text-sm text-slate-500">Guimmia compila. Tu controlli e scegli soltanto valori coerenti.</p>
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

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <span className="font-bold">Non devi compilare tutto a mano.</span>{" "}
              Scrivi nella chat ciò che sai: Guimmia aggiorna questa bozza e ti domanda soltanto ciò che manca.
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Obiettivo
                <select
                  value={draft.objective}
                  onChange={(event) => updateDraft("objective", event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Scegli l’obiettivo</option>
                  {GUIMMIA_OBJECTIVE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {isRentalObjective(draft.objective) ? (
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  Tipo di affitto
                  <select
                    value={draft.operationType ?? ""}
                    onChange={(event) => updateOperationType(event.target.value)}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Scegli il tipo di affitto</option>
                    {GUIMMIA_RENTAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Tipo di immobile
                <select
                  value={draft.propertyType}
                  onChange={(event) => updateDraft("propertyType", event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Scegli il tipo di immobile</option>
                  {GUIMMIA_PROPERTY_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Paese
                <select
                  value={draft.country}
                  onChange={(event) => updateAddress({
                    country: event.target.value,
                    city: draft.city,
                    province: draft.province,
                    postalCode: draft.postalCode,
                    address: draft.address,
                    latitude: draft.latitude,
                    longitude: draft.longitude,
                  }, "manual")}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Scegli il Paese</option>
                  {GUIMMIA_COUNTRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <GuidedAddressSearch
                value={{
                  country: draft.country,
                  city: draft.city,
                  province: draft.province,
                  postalCode: draft.postalCode,
                  address: draft.address,
                  latitude: draft.latitude,
                  longitude: draft.longitude,
                }}
                onChange={updateAddress}
                countryOptions={GUIMMIA_COUNTRY_OPTIONS}
                locationConfirmed={draft.locationVerified}
              />

              {draft.city ? (
                <div className={`rounded-2xl border p-4 ${draft.locationVerified ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                  <p className="text-sm font-bold text-slate-900">
                    {draft.locationVerified ? "Posizione confermata" : "Conferma la posizione"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {[draft.address, draft.postalCode, draft.city, draft.province, draft.country].filter(Boolean).join(", ")}
                  </p>
                  {!draft.locationVerified ? (
                    <button
                      type="button"
                      onClick={confirmLocation}
                      className="mt-3 min-h-10 w-full rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Sì, la posizione è corretta
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  Superficie (m²)
                  <input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    max="100000"
                    value={draft.surface}
                    onChange={(event) => updateDraft("surface", event.target.value)}
                    placeholder="Es. 120"
                    className="min-h-11 min-w-0 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  Vani o camere
                  <select
                    value={draft.rooms}
                    onChange={(event) => updateDraft("rooms", event.target.value)}
                    className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Scegli</option>
                    {Array.from({ length: 20 }, (_, index) => String(index + 1)).map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Stato dell’immobile
                <select
                  value={draft.condition}
                  onChange={(event) => updateDraft("condition", event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Scegli lo stato</option>
                  {GUIMMIA_CONDITION_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Disponibilità
                <select
                  value={draft.occupancy}
                  onChange={(event) => updateDraft("occupancy", event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Scegli la disponibilità</option>
                  {GUIMMIA_OCCUPANCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

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
            </>
            ) : workspacePanel === "DOCUMENTS" ? (
              <GuimmiaDocumentWorkspace
                draftId={draft.id}
                refreshToken={documentRefreshToken}
                onStatus={(message) => {
                  addMessage("pilot", message);
                  setCaseRoomRefreshToken((current) => current + 1);
                }}
              />
            ) : (
              <GuimmiaAgendaWorkspace
                draftId={draft.id}
                proposal={scheduleProposal}
                onProposalHandled={() => setScheduleProposal(null)}
                onStatus={(message) => {
                  addMessage("pilot", message);
                  setCaseRoomRefreshToken((current) => current + 1);
                }}
              />
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
