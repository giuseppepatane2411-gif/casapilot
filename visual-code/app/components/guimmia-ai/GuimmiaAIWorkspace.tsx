"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileSearch,
  FileText,
  Folder,
  FolderKanban,
  FolderPlus,
  Home,
  LoaderCircle,
  Menu,
  MessageSquare,
  MessageSquareText,
  PanelLeftClose,
  Plus,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react";

import Logo from "@/components/brand/Logo";
import GuimmiaAssistantMessage from "@/components/guimmia-ai/GuimmiaAssistantMessage";
import ConversationTools from "@/components/guimmia-ai/ConversationTools";
import styles from "@/components/guimmia-ai/GuimmiaWorkspace.module.css";
import { conversationPath, loadOwnedConversation, questionFocus, unansweredQuestion, updateOwnedConversation } from "@/lib/guimmia-ai/conversation-tools";
import { confirmMessageSave, createLatestRequestGate } from "@/lib/guimmia-ai/workspace-reliability";
import {
  practiceLabel,
  practiceToAssistantCase,
} from "@/lib/guimmia-ai/practice-context";
import {
  type GuimmiaAIConversation,
  type GuimmiaAIMessage,
  type GuimmiaAIPracticeLink,
  type GuimmiaAIProject,
  type GuimmiaAIReviewRequest,
  type GuimmiaAssistantFocus,
} from "@/lib/guimmia-ai/types";
import {
  classifyGuimmiaBrainRequest,
  formatGuimmiaBrainAnswer,
  requestGuimmiaBrain,
} from "@/lib/guimmia/openai/brain-client";
import { parsePropertyJourney } from "@/lib/property-journey/model";
import type { PropertyJourney } from "@/lib/property-journey/types";
import { createClient } from "@/lib/supabase/client";

type GuimmiaAIWorkspaceProps = {
  userId: string;
  userName: string;
  userEmail: string;
  initialMessage: string;
  initialFocus: GuimmiaAssistantFocus;
  initialConversationId?: string;
};

type ReviewComposer = {
  message: GuimmiaAIMessage;
  note: string;
};

const focusOptions: Array<{
  value: GuimmiaAssistantFocus;
  label: string;
  icon: typeof Sparkles;
}> = [
  { value: "GENERAL", label: "Generale", icon: Sparkles },
  { value: "SALE", label: "Vendita e acquisto", icon: Home },
  { value: "RENT", label: "Affitto", icon: Building2 },
  { value: "LISTING", label: "Annunci", icon: MessageSquareText },
  { value: "CONTRACT", label: "Bozze", icon: Scale },
  { value: "DOCUMENTS", label: "Documenti", icon: FileSearch },
  { value: "VALUATION", label: "Valutazione", icon: FileText },
];

const starters: Array<{
  title: string;
  description: string;
  prompt: string;
  focus: GuimmiaAssistantFocus;
  icon: typeof Sparkles;
}> = [
  {
    title: "Capire una compravendita",
    description: "Passaggi, documenti e controlli da non saltare.",
    prompt:
      "Devo affrontare una compravendita immobiliare in Italia. Aiutami a inquadrare il caso e fammi le domande necessarie, una alla volta.",
    focus: "SALE",
    icon: Home,
  },
  {
    title: "Creare un annuncio",
    description: "Una bozza completa a partire dai dati reali.",
    prompt:
      "Aiutami a creare un annuncio immobiliare efficace. Prima raccogli da me tutti i dati indispensabili.",
    focus: "LISTING",
    icon: MessageSquareText,
  },
  {
    title: "Impostare una bozza",
    description: "Campi mancanti e verifiche professionali visibili.",
    prompt:
      "Devo impostare una bozza per un'operazione immobiliare. Chiedimi prima che documento serve e quali sono i dati essenziali.",
    focus: "CONTRACT",
    icon: Scale,
  },
  {
    title: "Controllare i documenti",
    description: "Una checklist legata al tipo di operazione.",
    prompt:
      "Aiutami a capire quali documenti immobiliari servono nel mio caso e quali controlli devo affidare a un professionista.",
    focus: "DOCUMENTS",
    icon: FileSearch,
  },
];

const toolLinks = [
  { href: "/ai", label: "Assistente", icon: Sparkles },
  { href: "/dashboard/properties", label: "Pratiche", icon: FolderKanban },
  { href: "/dashboard/documents", label: "Documenti", icon: FileSearch },
  { href: "/valuta-immobile", label: "Valutazione", icon: FileText },
] as const;

function friendlyError(value: unknown) {
  const code = value instanceof Error ? value.message : "";
  const messages: Record<string, string> = {
    authentication_required:
      "La sessione è scaduta. Accedi di nuovo per continuare.",
    openai_not_configured: "Il collegamento a OpenAI non è ancora attivo.",
    database_not_configured: "Il database di Guimmia non è ancora collegato.",
    request_limit_reached:
      "Hai inviato molte richieste in poco tempo. Attendi qualche minuto e riprova.",
    budget_limit_reached:
      "Il servizio ha raggiunto il limite di utilizzo temporaneo. Riprova più tardi.",
    brain_guidance_failed:
      "Guimmia non è riuscita a completare questa risposta. Riprova tra poco.",
  };
  return (
    messages[code] ??
    "Non è stato possibile completare la richiesta. Riprova tra poco."
  );
}

function titleFromQuestion(question: string) {
  const compact = question.replace(/\s+/g, " ").trim();
  return compact.length > 58 ? `${compact.slice(0, 58).trim()}…` : compact;
}

function sortConversations(items: GuimmiaAIConversation[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.updated_at).getTime() -
      new Date(left.updated_at).getTime(),
  );
}

function latestReviewMap(items: GuimmiaAIReviewRequest[]) {
  return items.reduce<Record<string, GuimmiaAIReviewRequest>>(
    (result, request) => {
      if (!result[request.conversation_id]) {
        result[request.conversation_id] = request;
      }
      return result;
    },
    {},
  );
}

async function fetchJourneys() {
  const response = await fetch("/api/owner/journeys", {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("practice_context_unavailable");
  const payload = (await response.json()) as { journeys?: unknown };
  if (!Array.isArray(payload.journeys)) return [];
  return payload.journeys
    .map(parsePropertyJourney)
    .filter((journey): journey is PropertyJourney => Boolean(journey));
}

export default function GuimmiaAIWorkspace({
  userId,
  userName,
  userEmail,
  initialMessage,
  initialFocus,
  initialConversationId,
}: GuimmiaAIWorkspaceProps) {
  const [projects, setProjects] = useState<GuimmiaAIProject[]>([]);
  const [conversations, setConversations] = useState<GuimmiaAIConversation[]>(
    [],
  );
  const [messages, setMessages] = useState<GuimmiaAIMessage[]>([]);
  const [practiceByConversation, setPracticeByConversation] = useState<
    Record<string, PropertyJourney>
  >({});
  const [reviewByConversation, setReviewByConversation] = useState<
    Record<string, GuimmiaAIReviewRequest>
  >({});
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [focus, setFocus] =
    useState<GuimmiaAssistantFocus>(initialFocus);
  const [input, setInput] = useState(initialMessage);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const sendLock = useRef(false);
  const messageGate = useRef(createLatestRequestGate());
  const [pendingSave, setPendingSave] = useState<GuimmiaAIMessage | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const saveLock = useRef(false);
  const [workspaceAvailable, setWorkspaceAvailable] = useState(false);
  const [reloadLibrary, setReloadLibrary] = useState(0);
  const [messageLoadFailed, setMessageLoadFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [contextNotice, setContextNotice] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectComposerOpen, setProjectComposerOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectSaving, setProjectSaving] = useState(false);
  const projectLock = useRef(false);
  const [conversationSaving, setConversationSaving] = useState(false);
  const conversationLock = useRef(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [reviewComposer, setReviewComposer] =
    useState<ReviewComposer | null>(null);
  const [reviewSending, setReviewSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLibraryLoading(true);
    setWorkspaceAvailable(false);

    async function loadWorkspace() {
      const supabase = createClient();
      const [projectResult, conversationResult, linkResult, reviewResult] =
        await Promise.all([
          supabase
            .from("guimmia_ai_projects")
            .select("id,name,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("guimmia_ai_conversations")
            .select("id,project_id,title,focus,created_at,updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(100),
          supabase
            .from("guimmia_ai_practice_links")
            .select("conversation_id,listing_id,created_at")
            .eq("user_id", userId),
          supabase
            .from("guimmia_ai_review_requests")
            .select(
              "id,conversation_id,listing_id,request_type,subject,note,status,created_at,updated_at",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      if (cancelled) return;

      if (projectResult.error || conversationResult.error) {
        setErrorMessage(
          "La memoria cloud non è disponibile. Controlla la connessione e riprova; se il problema continua, verifica la configurazione del database.",
        );
        setLibraryLoading(false);
        return;
      }

      let loadedConversations = sortConversations(
        (conversationResult.data ?? []) as GuimmiaAIConversation[],
      );
      // A direct link must also reopen a chat older than the 100 recent items.
      if (initialConversationId && !loadedConversations.some((item) => item.id === initialConversationId)) {
        const requested = await loadOwnedConversation(supabase, userId, initialConversationId);
        if (cancelled) return;
        if (requested) loadedConversations = sortConversations([...loadedConversations, requested]);
        else setContextNotice("Questa conversazione non è disponibile per il tuo account. Puoi aprire una delle tue chat o iniziarne una nuova.");
      }
      setProjects((projectResult.data ?? []) as GuimmiaAIProject[]);
      setConversations(loadedConversations);
      if (linkResult.error || reviewResult.error) {
        setContextNotice("Chat disponibili; collegamenti alle pratiche o richieste di verifica non disponibili. Verifica il database prima di usare queste funzioni.");
      }

      if (!reviewResult.error) {
        setReviewByConversation(
          latestReviewMap(
            (reviewResult.data ?? []) as GuimmiaAIReviewRequest[],
          ),
        );
      }

      if (!linkResult.error && linkResult.data?.length) {
        try {
          const journeys = await fetchJourneys();
          if (!cancelled) {
            const journeysById = new Map(
              journeys.map((journey) => [journey.id, journey]),
            );
            const linkedPractices = (
              linkResult.data as GuimmiaAIPracticeLink[]
            ).reduce<Record<string, PropertyJourney>>((result, link) => {
              const journey = journeysById.get(link.listing_id);
              if (journey) result[link.conversation_id] = journey;
              return result;
            }, {});
            setPracticeByConversation(linkedPractices);
          }
        } catch {
          if (!cancelled) {
            setContextNotice(
              "Le chat sono disponibili, ma il contesto delle pratiche non è stato caricato.",
            );
          }
        }
      }

      if (cancelled) return;
      const requestedConversation = initialConversationId
        ? loadedConversations.find(
            (conversation) => conversation.id === initialConversationId,
          )
        : undefined;
      if (requestedConversation) {
        setActiveConversationId(requestedConversation.id);
        setFocus(requestedConversation.focus);
        setMessagesLoading(true);
        const messageResult = await supabase
          .from("guimmia_ai_messages")
          .select("id,conversation_id,role,content,metadata,created_at")
          .eq("user_id", userId)
          .eq("conversation_id", requestedConversation.id)
          .order("created_at", { ascending: true });
        if (!cancelled) {
          if (messageResult.error) {
            setMessageLoadFailed(true);
            setErrorMessage(
              "La pratica è collegata, ma la conversazione non può essere caricata.",
            );
          } else {
            setMessages((messageResult.data ?? []) as GuimmiaAIMessage[]);
          }
          setMessagesLoading(false);
        }
      }

      if (!cancelled) {
        setWorkspaceAvailable(true);
        setLibraryLoading(false);
      }
    }

    void loadWorkspace().catch(() => {
      if (!cancelled) {
        setErrorMessage("Impossibile caricare la memoria cloud. Controlla la connessione e riprova.");
        setLibraryLoading(false);
      }
    });
    return () => {
      cancelled = true;
      messageGate.current.invalidate();
    };
  }, [initialConversationId, userId, reloadLibrary]);

  useEffect(() => {
    if (!pendingSave && !sending && !conversationSaving && !input.trim()) return;
    const protectUnsaved = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectUnsaved);
    return () => window.removeEventListener("beforeunload", protectUnsaved);
  }, [pendingSave, sending, conversationSaving, input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "end" });
  }, [messages, sending]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        (!selectedProjectId || conversation.project_id === selectedProjectId) &&
        conversation.title.toLocaleLowerCase("it-IT").includes(conversationSearch.trim().toLocaleLowerCase("it-IT")),
      ),
    [conversations, selectedProjectId, conversationSearch],
  );

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const unanswered = unansweredQuestion(messages, activeConversationId);
  const activePractice = activeConversationId
    ? practiceByConversation[activeConversationId]
    : undefined;
  const activeReview = activeConversationId
    ? reviewByConversation[activeConversationId]
    : undefined;
  const practiceGoal = focus === "RENT" ? "rent" : "sale";
  const practiceHref = activePractice
    ? `/dashboard/properties/${encodeURIComponent(activePractice.id)}`
    : activeConversationId
      ? `/dashboard/properties/new?goal=${practiceGoal}&from=ai&conversation=${encodeURIComponent(activeConversationId)}`
      : `/dashboard/properties/new?goal=${practiceGoal}&from=ai`;

  function newConversation() {
    if (sendLock.current || conversationLock.current || libraryLoading || pendingSave) return;
    if (input.trim() && !window.confirm("Cambiare chat e scartare il testo non inviato?")) return;
    messageGate.current.invalidate();
    setMessagesLoading(false);
    setMessageLoadFailed(false);
    setReviewComposer(null);
    setActiveConversationId(null);
    window.history.replaceState(null, "", conversationPath());
    setMessages([]);
    setInput("");
    setErrorMessage("");
    setContextNotice("");
    setFocus("GENERAL");
    setMobileSidebarOpen(false);
  }

  async function openConversation(conversation: GuimmiaAIConversation) {
    if (sendLock.current || conversationLock.current || libraryLoading || pendingSave) return;
    if (input.trim() && !window.confirm("Cambiare chat e scartare il testo non inviato?")) return;
    const ticket = messageGate.current.next();
    setInput("");
    setContextNotice("");
    setReviewComposer(null);
    setMessageLoadFailed(false);
    setActiveConversationId(conversation.id);
    window.history.replaceState(null, "", conversationPath(conversation.id));
    setFocus(conversation.focus);
    setMessages([]);
    setMessagesLoading(true);
    setErrorMessage("");
    setMobileSidebarOpen(false);

    try {
      const { data, error } = await createClient()
      .from("guimmia_ai_messages")
      .select("id,conversation_id,role,content,metadata,created_at")
      .eq("user_id", userId)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

      if (!messageGate.current.isCurrent(ticket)) return;
      if (error) throw error;
      setMessages((data ?? []) as GuimmiaAIMessage[]);
    } catch {
      if (!messageGate.current.isCurrent(ticket)) return;
      setMessageLoadFailed(true);
      setErrorMessage("Non è stato possibile caricare questa conversazione.");
    } finally {
      if (messageGate.current.isCurrent(ticket)) setMessagesLoading(false);
    }
  }

  async function saveMessage(message: GuimmiaAIMessage) {
    return confirmMessageSave(
      async () => await createClient().from("guimmia_ai_messages").insert({ ...message, user_id: userId }),
      async () => {
        const { data, error } = await createClient().from("guimmia_ai_messages")
          .select("id,conversation_id,role,content")
          .eq("id", message.id).eq("user_id", userId)
          .eq("conversation_id", message.conversation_id).maybeSingle();
        return !error && data?.role === message.role && data?.content === message.content;
      },
    );
  }

  async function retryMessageSave() {
    if (!pendingSave || saveLock.current) return;
    saveLock.current = true;
    setSaveBusy(true);
    try {
      if (await saveMessage(pendingSave)) {
        setPendingSave(null);
        setErrorMessage("");
        setContextNotice("Risposta salvata nel cloud. Nessuna nuova richiesta all’IA.");
      }
    } finally {
      saveLock.current = false;
      setSaveBusy(false);
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectName.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!name || projectLock.current || libraryLoading || !workspaceAvailable) return;
    projectLock.current = true;
    setProjectSaving(true);
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await createClient().from("guimmia_ai_projects").insert({ id, user_id: userId, name });
      if (error) throw error;
      setProjects((current) => [...current, { id, name, created_at: now }]);
      setSelectedProjectId(id);
      setProjectName("");
      setProjectComposerOpen(false);
    } catch { setErrorMessage("Non è stato possibile creare la cartella. Controlla la connessione e riprova."); }
    finally { projectLock.current = false; setProjectSaving(false); }
  }

  async function saveConversationDetails(title: string, projectId: string | null) {
    if (!activeConversationId || sendLock.current || conversationLock.current || pendingSave) return false;
    if (projectId && !projects.some((item) => item.id === projectId)) return false;
    conversationLock.current = true;
    setConversationSaving(true);
    try {
      const updated = await updateOwnedConversation(createClient(), userId, activeConversationId, title, projectId);
      setConversations((current) => sortConversations(current.map((item) => item.id === updated.id ? updated : item)));
      if (selectedProjectId && selectedProjectId !== updated.project_id) setSelectedProjectId(updated.project_id);
      return true;
    } catch { return false; }
    finally { conversationLock.current = false; setConversationSaving(false); }
  }

  async function sendQuestion(
    question: string,
    requestedFocus = focus,
    retry?: GuimmiaAIMessage,
  ) {
    const trimmed = question.trim().slice(0, 2000);
    if (!trimmed || sendLock.current || conversationLock.current || libraryLoading || messagesLoading || messageLoadFailed || !workspaceAvailable || pendingSave) return;
    if (retry && unansweredQuestion(messages, activeConversationId)?.id !== retry.id) return;
    sendLock.current = true;

    setErrorMessage("");
    setSending(true);
    if (!retry) setInput("");

    const supabase = createClient();
    const now = new Date().toISOString();
    let conversationId = activeConversationId;
    let questionSaved = Boolean(retry);

    try {
      if (!conversationId) {
        conversationId = crypto.randomUUID();
        const createdConversation: GuimmiaAIConversation = {
          id: conversationId,
          project_id: selectedProjectId,
          title: titleFromQuestion(trimmed),
          focus: requestedFocus,
          created_at: now,
          updated_at: now,
        };
        const { error } = await supabase
          .from("guimmia_ai_conversations")
          .insert({ ...createdConversation, user_id: userId });
        if (error) throw new Error("cloud_conversation_failed");

        setActiveConversationId(conversationId);
        window.history.replaceState(null, "", conversationPath(conversationId));
        setConversations((current) =>
          sortConversations([createdConversation, ...current]),
        );
      }

      const userMessage: GuimmiaAIMessage = retry ?? {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "user",
        content: trimmed,
        metadata: { focus: requestedFocus },
        created_at: now,
      };
      if (!retry && !(await saveMessage(userMessage))) throw new Error("cloud_message_failed");
      questionSaved = true;

      const nextMessages = retry ? messages : [...messages, userMessage];
      setMessages(nextMessages);
      const linkedPractice = conversationId
        ? practiceByConversation[conversationId]
        : undefined;
      const result = await requestGuimmiaBrain({
        experience: "assistant",
        conversationId,
        focus: requestedFocus,
        question: trimmed,
        requestKind: classifyGuimmiaBrainRequest(
          requestedFocus === "CONTRACT" || requestedFocus === "LISTING"
            ? `scrivi ${trimmed}`
            : trimmed,
        ),
        case: linkedPractice
          ? practiceToAssistantCase(linkedPractice)
          : undefined,
        conversation: nextMessages.slice(-8).map((message) => ({
          role: message.role,
          text: message.content,
        })),
      });

      const assistantMessage: GuimmiaAIMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "assistant",
        content: formatGuimmiaBrainAnswer(result),
        metadata: {
          replyToMessageId: userMessage.id,
          interactionId: result.interactionId,
          focus: requestedFocus,
          cacheHit: result.cacheHit,
          confidence: result.answer.confidence,
          humanReviewRequired: result.answer.handoffRequired,
          answerTitle: result.answer.title,
          answerReply: result.answer.reply,
          nextAction: result.answer.nextAction,
          nextActionOwner: result.answer.nextActionOwner,
          followUpQuestions: result.answer.followUpQuestions,
          missingDocuments: result.answer.missingDocuments,
          warnings: result.answer.warnings,
          handoffReason: result.answer.handoffReason,
          references: result.answer.references,
          practiceLinked: Boolean(linkedPractice),
        },
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [...current, assistantMessage]);

      if (!(await saveMessage(assistantMessage))) {
        setPendingSave(assistantMessage);
        setErrorMessage(
          "La risposta è visibile, ma non è stata salvata nel cloud. Usa Riprova salvataggio: la risposta non verrà rigenerata.",
        );
      }

      const updatedAt = assistantMessage.created_at;
      const { error: conversationUpdateError } = await supabase
        .from("guimmia_ai_conversations")
        .update({ focus: requestedFocus, updated_at: updatedAt })
        .eq("id", conversationId)
        .eq("user_id", userId);
      if (conversationUpdateError) setContextNotice("Messaggi disponibili; l’ordine delle chat recenti non è stato sincronizzato.");
      setConversations((current) =>
        sortConversations(
          current.map((item) =>
            item.id === conversationId
              ? { ...item, focus: requestedFocus, updated_at: updatedAt }
              : item,
          ),
        ),
      );
      setFocus(requestedFocus);
    } catch (caught) {
      if (
        caught instanceof Error &&
        ["cloud_conversation_failed", "cloud_message_failed"].includes(
          caught.message,
        )
      ) {
        setErrorMessage(
          "La domanda non è stata confermata nel cloud. Il testo resta nel campo di scrittura; nessuna richiesta è stata inviata all’IA.",
        );
      } else {
        setErrorMessage(friendlyError(caught));
      }
      if (!questionSaved) setInput(trimmed);
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewComposer || !activeConversationId || reviewSending) return;

    setReviewSending(true);
    setErrorMessage("");
    const now = new Date().toISOString();
    const request: GuimmiaAIReviewRequest = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId,
      listing_id: activePractice?.id ?? null,
      request_type:
        reviewComposer.message.metadata.humanReviewRequired === true
          ? "PROFESSIONAL_REVIEW"
          : "GENERAL_REVIEW",
      subject: (activeConversation?.title || "Verifica risposta Guimmia").slice(
        0,
        160,
      ),
      note: reviewComposer.note.replace(/\s+/g, " ").trim().slice(0, 1000),
      status: "SUBMITTED",
      created_at: now,
      updated_at: now,
    };

    const { error } = await createClient()
      .from("guimmia_ai_review_requests")
      .insert({
        ...request,
        user_id: userId,
        message_snapshot: reviewComposer.message.content.slice(0, 12000),
        context: {
          focus,
          interactionId: reviewComposer.message.metadata.interactionId ?? null,
          practiceLinked: Boolean(activePractice),
          requestedFrom: "assistant_message",
        },
      });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "Per questa conversazione esiste già una verifica aperta."
          : "La richiesta non è stata salvata. Controlla la connessione e riprova.",
      );
    } else {
      setReviewByConversation((current) => ({
        ...current,
        [activeConversationId]: request,
      }));
      setReviewComposer(null);
    }
    setReviewSending(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(input);
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-[#07152f] text-white">
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-4">
        <Logo compact inverted />
        <button
          type="button"
          onClick={() => {
            setMobileSidebarOpen(false);
            setSidebarCollapsed(true);
          }}
          aria-label="Chiudi barra laterale"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="p-3">
        <button
          type="button"
          data-guimmia-action
          disabled={sending || conversationSaving || libraryLoading || Boolean(pendingSave)}
          onClick={newConversation}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-blue-600 px-3 text-sm font-extrabold shadow-lg shadow-blue-950/30 hover:bg-blue-500"
        >
          <Plus size={18} /> Nuova conversazione
        </button>
      </div>

      <nav className="grid grid-cols-2 gap-1 px-3 pb-3" aria-label="Strumenti">
        {toolLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex min-h-9 items-center gap-2 rounded-lg px-2 text-[11px] font-bold ${
              href === "/ai"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={14} /> {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Cartelle
          </span>
          <button
            type="button"
            onClick={() => setProjectComposerOpen((current) => !current)}
            aria-label="Crea cartella"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <FolderPlus size={15} />
          </button>
        </div>

        {projectComposerOpen ? (
          <form onSubmit={createProject} className="mb-2 flex gap-2 px-1">
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              maxLength={60}
              disabled={projectSaving}
              autoFocus
              placeholder="Nome cartella"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={!projectName.trim() || projectSaving || libraryLoading || !workspaceAvailable}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 disabled:opacity-40"
              aria-label="Salva cartella"
            >
              {projectSaving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={() => setSelectedProjectId(null)}
          className={`flex min-h-9 w-full items-center gap-3 rounded-lg px-2 text-left text-xs font-semibold ${
            selectedProjectId === null
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <MessageSquare size={15} /> Tutte le chat
        </button>
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setSelectedProjectId(project.id)}
            className={`mt-1 flex min-h-9 w-full items-center gap-3 rounded-lg px-2 text-left text-xs font-semibold ${
              selectedProjectId === project.id
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Folder size={15} />
            <span className="truncate">{project.name}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/10 px-3 py-3">
        <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Recenti
        </p>
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-white/15 px-3 text-slate-400">
          <Search size={15} className="shrink-0" />
          <input type="search" aria-label="Cerca per titolo nelle chat recenti" placeholder="Cerca nelle chat recenti" value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} className="min-h-10 min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        {libraryLoading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500">
            <LoaderCircle size={14} className="animate-spin" /> Caricamento…
          </div>
        ) : filteredConversations.length ? (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              disabled={sending || conversationSaving || libraryLoading || Boolean(pendingSave)}
              onClick={() => void openConversation(conversation)}
              className={`mb-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-xs ${
                activeConversationId === conversation.id
                  ? "bg-white/10 font-bold text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-50"
              }`}
            >
              {practiceByConversation[conversation.id] ? (
                <Building2 size={14} className="shrink-0 text-blue-400" />
              ) : (
                <MessageSquare size={14} className="shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {conversation.title}
              </span>
              {reviewByConversation[conversation.id]?.status === "SUBMITTED" ||
              reviewByConversation[conversation.id]?.status === "IN_REVIEW" ? (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                  title="Verifica aperta"
                />
              ) : null}
            </button>
          ))
        ) : (
          <p className="px-2 py-3 text-xs leading-5 text-slate-500">
            {conversationSearch ? "Nessuna chat recente con questo titolo." : "Nessuna conversazione in questa cartella."}
          </p>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/dashboard/account"
          className="mt-1 flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-white/5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <UserRound size={15} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-white">
              {userName}
            </span>
            <span className="block truncate text-[10px] text-slate-500">
              {userEmail}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );

  return (
    <main className={`${styles.workspace} min-h-screen bg-[#f7f9fd] text-slate-950`} onClickCapture={(event) => {
      const link = (event.target as HTMLElement).closest("a");
      if ((pendingSave || sendLock.current || conversationLock.current) && link && link.target !== "_blank") {
        event.preventDefault();
        event.stopPropagation();
        setContextNotice("Attendi il completamento e il salvataggio della risposta prima di lasciare la chat.");
      } else if (input.trim() && link && link.target !== "_blank" && !window.confirm("Lasciare la chat e scartare il testo non inviato?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }}>
      {!sidebarCollapsed ? (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] lg:block">
          {sidebar}
        </aside>
      ) : null}

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Chiudi menu"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <aside className="relative h-full w-[min(88vw,326px)] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div
        className={`flex min-h-screen flex-col transition-[padding] ${
          !sidebarCollapsed ? "lg:pl-[292px]" : ""
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.innerWidth >= 1024) setSidebarCollapsed(false);
                  else setMobileSidebarOpen(true);
                }}
                aria-label="Apri barra laterale"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 ${
                  !sidebarCollapsed ? "lg:hidden" : ""
                }`}
              >
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-extrabold sm:text-base">
                    {activeConversation?.title || "Guimmia"}
                  </h1>
                </div>
                <p className="truncate text-[10px] text-slate-400">
                  La tua guida immobiliare intelligente.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {activePractice ? (
                <Link
                  href={practiceHref}
                  className="hidden max-w-[280px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100 sm:flex"
                >
                  <Check size={14} />
                  <span className="truncate">
                    {practiceLabel(activePractice)}
                  </span>
                  <ArrowRight size={13} className="shrink-0" />
                </Link>
              ) : (
                <Link
                  href={practiceHref}
                  className="hidden min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 sm:inline-flex"
                >
                  Collega una pratica
                  <ArrowRight size={14} />
                </Link>
              )}
              <Link
                href="/"
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Home
              </Link>
            </div>
          </div>

          {activePractice ? (
            <div className="border-t border-emerald-100 bg-emerald-50/70 px-4 py-2 sm:px-6">
              <div className="mx-auto flex max-w-4xl items-center gap-2 text-[11px] leading-5 text-emerald-800">
                <ShieldCheck size={14} className="shrink-0" />
                <span>
                  Questa chat usa tipo di operazione, località e checklist della
                  pratica. L’indirizzo preciso non viene inviato al modello.
                </span>
              </div>
            </div>
          ) : null}
        </header>

        <section className="flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-56 pt-7 sm:px-6 sm:pt-10">
            {activeConversation && !libraryLoading && !messagesLoading && !messageLoadFailed ? (
              <ConversationTools key={activeConversation.id} conversation={activeConversation} projects={projects} messages={messages} busy={sending || conversationSaving} pendingMessageId={pendingSave?.id} onSave={saveConversationDetails} />
            ) : null}
            {messagesLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                <LoaderCircle size={20} className="mr-3 animate-spin" />
                Caricamento conversazione…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center py-8">
                <div className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                    <Sparkles size={24} />
                  </span>
                  <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Una domanda può diventare una pratica
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
                    Da cosa vuoi partire?
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                    Descrivi il tuo caso. Guimmia organizza la risposta, mette in
                    evidenza ciò che manca e conserva il lavoro nella tua area
                    privata.
                  </p>
                  <Link
                    href={practiceHref}
                    className="mx-auto mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-xs font-extrabold text-blue-700 shadow-sm hover:bg-blue-50"
                  >
                    <FolderKanban size={15} />
                    {activePractice
                      ? "Apri la pratica collegata"
                      : "Parti direttamente da un immobile"}
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {starters.map(
                    ({
                      title,
                      description,
                      prompt,
                      focus: starterFocus,
                      icon: Icon,
                    }) => (
                      <button
                        key={title}
                        type="button"
                        data-guimmia-action
                        onClick={() => void sendQuestion(prompt, starterFocus)}
                        disabled={sending || libraryLoading || messagesLoading || messageLoadFailed || !workspaceAvailable || Boolean(pendingSave)}
                        className="group rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md disabled:opacity-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600">
                          <Icon size={17} />
                        </span>
                        <span className="mt-3 block text-sm font-extrabold">
                          {title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {description}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message) =>
                  message.role === "user" ? (
                    <article key={message.id} className="flex justify-end">
                      <div className="max-w-[90%] rounded-3xl rounded-br-lg bg-[#e9eef8] px-5 py-3 text-sm leading-7 text-slate-800 sm:max-w-[78%]">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </article>
                  ) : (
                    <GuimmiaAssistantMessage
                      key={message.id}
                      message={message}
                      notSaved={pendingSave?.id === message.id}
                      reviewStatus={activeReview?.status}
                      reviewBusy={reviewSending}
                      onRequestReview={(selectedMessage) =>
                        setReviewComposer({
                          message: selectedMessage,
                          note: "",
                        })
                      }
                    />
                  ),
                )}
                {sending ? (
                  <div
                    className="grid grid-cols-[38px_1fr] gap-3 sm:grid-cols-[44px_1fr] sm:gap-4"
                    aria-live="polite"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white sm:h-11 sm:w-11">
                      <Sparkles size={18} />
                    </span>
                    <div className="flex items-center gap-2 pt-3 text-sm text-slate-500">
                      <LoaderCircle size={16} className="animate-spin" />
                      Guimmia sta analizzando domanda, contesto e prossimi passi…
                    </div>
                  </div>
                ) : null}
                {unanswered && !sending && !pendingSave && !messagesLoading && !messageLoadFailed ? (
                  <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
                    <p>La tua domanda è salvata. La risposta non è ancora disponibile: puoi riprovare da qui.</p>
                    <button type="button" data-guimmia-action disabled={!workspaceAvailable || libraryLoading || conversationSaving} onClick={() => void sendQuestion(unanswered.content, questionFocus(unanswered), unanswered)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 font-bold text-white disabled:opacity-50"><RotateCcw size={16} /> Riprova risposta</button>
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div
            className={`fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#f7f9fd] via-[#f7f9fd] to-transparent px-4 pb-4 pt-10 sm:px-6 ${
              !sidebarCollapsed ? "lg:left-[292px]" : ""
            }`}
          >
            <div className="mx-auto max-w-4xl">
              {pendingSave ? (
                <div role="status" className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
                  <p>Risposta non ancora salvata. Non chiudere questa pagina: puoi ritentare il salvataggio o copiare la risposta dal messaggio.</p>
                  <button type="button" disabled={saveBusy} onClick={() => void retryMessageSave()} className="mt-2 rounded-lg bg-[#07152f] px-3 py-2 font-bold text-white disabled:opacity-50">
                    {saveBusy ? "Salvataggio…" : "Riprova salvataggio"}
                  </button>
                </div>
              ) : null}
              {!libraryLoading && !workspaceAvailable ? (
                <button type="button" onClick={() => { setErrorMessage(""); setReloadLibrary((value) => value + 1); }} className="mb-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">Riprova caricamento cloud</button>
              ) : null}
              {messageLoadFailed && activeConversation ? (
                <button type="button" onClick={() => void openConversation(activeConversation)} className="mb-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">Ricarica questa conversazione</button>
              ) : null}
              {contextNotice ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  <span>{contextNotice}</span>
                  <button
                    type="button"
                    onClick={() => setContextNotice("")}
                    aria-label="Chiudi avviso"
                    className="shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : null}
              {errorMessage ? (
                <div
                  className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700"
                  role="alert"
                >
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage("")}
                    aria-label="Chiudi avviso"
                    className="shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : null}

              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {focusOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFocus(value)}
                    className={`flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold ${
                      focus === value
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={submit}
                className="rounded-[26px] border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)] focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/60"
              >
                <textarea
                  aria-label="Domanda per Guimmia"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={2}
                  maxLength={2000}
                  disabled={sending || libraryLoading || messagesLoading || messageLoadFailed || !workspaceAvailable || Boolean(pendingSave)}
                  placeholder={
                    activePractice
                      ? `Chiedi qualcosa sulla pratica “${activePractice.property.name}”…`
                      : "Scrivi una domanda sull’immobiliare…"
                  }
                  className="min-h-14 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-slate-400 disabled:cursor-wait"
                />
                <div className="flex items-center justify-between gap-3 px-1 pb-1">
                  <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-slate-400">
                    {activePractice ? (
                      <>
                        <Building2 size={11} className="shrink-0" />
                        <span className="truncate">
                          {practiceLabel(activePractice)}
                        </span>
                      </>
                    ) : (
                      <>
                        {focusOptions.find((item) => item.value === focus)?.label}
                        <ChevronDown size={11} />
                      </>
                    )}
                  </span>
                  <button
                    type="submit"
                    data-guimmia-action
                    disabled={!input.trim() || sending || libraryLoading || messagesLoading || messageLoadFailed || !workspaceAvailable || Boolean(pendingSave)}
                    aria-label="Invia messaggio"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {sending ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </button>
                </div>
              </form>
              <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                Guimmia può sbagliare. Bozze, controlli e decisioni
                immobiliari vanno verificati da un professionista qualificato.
              </p>
            </div>
          </div>
        </section>
      </div>

      {reviewComposer ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Chiudi richiesta di verifica"
            onClick={() => !reviewSending && setReviewComposer(null)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="relative w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <UserRoundCheck size={20} />
              </span>
              <button
                type="button"
                onClick={() => setReviewComposer(null)}
                disabled={reviewSending}
                aria-label="Chiudi"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <h2
              id="review-title"
              className="mt-4 text-2xl font-bold tracking-[-0.04em]"
            >
              Richiedi una verifica
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Guimmia salverà questa risposta, la conversazione e l’eventuale
              pratica collegata. L’invio non costituisce ancora un incarico
              professionale né garantisce tempi di risposta.
            </p>

            <form onSubmit={submitReview} className="mt-5">
              <label
                htmlFor="review-note"
                className="text-xs font-extrabold text-slate-700"
              >
                Cosa vuoi far controllare? <span className="font-medium">(facoltativo)</span>
              </label>
              <textarea
                id="review-note"
                value={reviewComposer.note}
                onChange={(event) =>
                  setReviewComposer((current) =>
                    current
                      ? { ...current, note: event.target.value.slice(0, 1000) }
                      : current,
                  )
                }
                rows={4}
                maxLength={1000}
                placeholder="Per esempio: vorrei verificare la clausola sulla caparra…"
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setReviewComposer(null)}
                  disabled={reviewSending}
                  className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-500 hover:bg-slate-100"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={reviewSending}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {reviewSending ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <ClipboardCheck size={16} />
                  )}
                  Salva richiesta
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
