"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Clock3,
  Copy,
  FileCheck2,
  FlaskConical,
  FolderLock,
  Home,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  TimerReset,
  X,
} from "lucide-react";

import { useBetaState } from "@/hooks/useBetaState";
import { useJourneys } from "@/hooks/useJourneys";
import { BETA_MILESTONES } from "@/lib/beta/constants";
import { DEMO_SCENARIOS, seedDemoScenario } from "@/lib/beta/demo";
import {
  markBetaMilestone,
  setBetaOnboardingDismissed,
  startBetaSession,
} from "@/lib/beta/storage";
import type { BetaScenario } from "@/lib/beta/types";

const scenarioIcons = {
  sale: Building2,
  rent: KeyRound,
  inheritance: Home,
};

export default function BetaLaunchpad() {
  const router = useRouter();
  const { hydrated: journeysHydrated, journeys, activeJourney } = useJourneys();
  const { hydrated: betaHydrated, state } = useBetaState();
  const [loadingScenario, setLoadingScenario] = useState<BetaScenario | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (journeysHydrated && journeys.length > 0) {
      markBetaMilestone("journey-created");
    }
  }, [journeys.length, journeysHydrated]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const completedMilestones = useMemo(
    () => new Set(state?.milestones ?? []),
    [state?.milestones],
  );
  const completion = Math.round(
    (completedMilestones.size / BETA_MILESTONES.length) * 100,
  );
  const activeSession = state?.sessions.find(
    (session) => session.id === state.activeSessionId,
  );
  const elapsedMinutes = activeSession
    ? Math.max(0, Math.floor((now - new Date(activeSession.startedAt).getTime()) / 60_000))
    : 0;

  if (!journeysHydrated || !betaHydrated || !state) {
    return <BetaSkeleton />;
  }

  function openScenario(scenarioId: BetaScenario) {
    setLoadingScenario(scenarioId);
    startBetaSession(scenarioId);
    const journey = seedDemoScenario(scenarioId);
    router.push(`/dashboard/pilot?journey=${journey.id}&test=1`);
  }

  async function copyTesterInvite() {
    const link = `${window.location.origin}/dashboard/beta`;
    const text = [
      "Ciao! Sto testando CasaPilot, un assistente che organizza il percorso per vendere o affittare un immobile.",
      "La prova richiede 8 minuti, non serve registrarsi e i dati restano nel browser.",
      `Apri il Test Flight: ${link}`,
      "Scegli uno scenario, completa una missione e alla fine dimmi senza filtri cosa non era chiaro.",
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2500);
    } catch {
      setInviteCopied(false);
    }
  }

  return (
    <div className="space-y-7">
      {!state.onboardingDismissed && (
        <section className="relative overflow-hidden rounded-[28px] border border-blue-200 bg-blue-50 p-5 sm:p-6">
          <button
            type="button"
            aria-label="Chiudi introduzione"
            onClick={() => setBetaOnboardingDismissed(true)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-blue-500 hover:bg-white hover:text-blue-800"
          >
            <X size={18} />
          </button>
          <div className="flex max-w-3xl items-start gap-4 pr-10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Rocket size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-blue-700">Beta Zero-Cost v2</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                Non è una pagina demo: è un test di prodotto misurabile.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Un tester sceglie una situazione reale, raggiunge la prima missione, allega un file locale e lascia un verdetto. CasaPilot misura il percorso senza account, cookie esterni o servizi a pagamento.
              </p>
            </div>
          </div>
        </section>
      )}

      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            <FlaskConical size={14} />
            CasaPilot Test Flight
          </span>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
            Otto minuti per capire se CasaPilot merita di esistere.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Scegli la situazione più vicina a te. Non dovrai compilare nulla: il test parte dal problema e arriva alla prima azione concreta.
          </p>
        </div>

        <Link
          href="/dashboard/feedback"
          className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 lg:self-auto"
        >
          <MessageSquareText size={18} />
          Verdetto del tester
        </Link>
      </header>

      {activeSession && (
        <section className="flex flex-col justify-between gap-4 rounded-[26px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white">
              <TimerReset size={20} />
            </span>
            <div>
              <p className="font-bold text-amber-950">Test in corso · {elapsedMinutes} min</p>
              <p className="mt-1 text-sm text-amber-800">
                Scenario {activeSession.scenario}. Completa una missione e lascia il feedback mentre la prima impressione è ancora fresca.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/pilot"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 text-sm font-bold text-white hover:bg-amber-800"
          >
            Riprendi il test
            <ArrowRight size={16} />
          </Link>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
        <div className="grid gap-4 lg:grid-cols-3">
          {DEMO_SCENARIOS.map((scenario, index) => {
            const Icon = scenarioIcons[scenario.id];
            const loading = loadingScenario === scenario.id;

            return (
              <article
                key={scenario.id}
                className={`group relative overflow-hidden rounded-[28px] border p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                  index === 2
                    ? "border-violet-200 bg-violet-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {index === 2 && (
                  <span className="absolute right-4 top-4 rounded-full bg-violet-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Test emotivo
                  </span>
                )}
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 2 ? "bg-violet-700 text-white" : "bg-slate-950 text-white"}`}>
                  <Icon size={22} />
                </span>
                <p className={`mt-5 text-xs font-bold uppercase tracking-[0.1em] ${index === 2 ? "text-violet-700" : "text-blue-600"}`}>
                  {scenario.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950">
                  {scenario.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {scenario.description}
                </p>
                <div className="mt-5 space-y-2 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-2">
                    <Clock3 size={14} className="text-blue-600" />
                    {scenario.duration}
                  </p>
                  <p className="flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-600" />
                    {scenario.outcome}
                  </p>
                  <p className="flex items-center gap-2">
                    <LockKeyhole size={14} className="text-blue-600" />
                    Nessun dato personale
                  </p>
                </div>
                <button
                  type="button"
                  disabled={Boolean(loadingScenario)}
                  onClick={() => openScenario(scenario.id)}
                  className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white shadow-lg disabled:cursor-wait disabled:opacity-60 ${index === 2 ? "bg-violet-700 hover:bg-violet-800" : "bg-slate-950 hover:bg-blue-600"}`}
                >
                  <Play size={17} />
                  {loading ? "Preparazione…" : "Avvia questo test"}
                </button>
              </article>
            );
          })}
        </div>

        <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">Funnel locale</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{completion}% completato</h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FlaskConical size={20} />
            </span>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${completion}%` }} />
          </div>

          <div className="mt-6 space-y-4">
            {BETA_MILESTONES.map((milestone, index) => {
              const completed = completedMilestones.has(milestone.id);

              return (
                <div key={milestone.id} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      completed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {completed ? <Check size={16} strokeWidth={2.8} /> : index + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${completed ? "text-slate-950" : "text-slate-700"}`}>
                      {milestone.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{milestone.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <article className="relative overflow-hidden rounded-[30px] bg-slate-950 p-6 text-white sm:p-8">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
              <FolderLock size={22} />
            </span>
            <p className="mt-5 text-sm font-semibold text-emerald-300">Nuovo momento wow senza API</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
              Allega un documento e guarda Pilot cambiare priorità.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              PDF e immagini vengono salvati in IndexedDB sul dispositivo. Il caricamento aggiorna checklist, Health Score, timeline e prossima missione, senza inviare nulla online.
            </p>
            <Link
              href="/dashboard/vault"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-slate-950 hover:bg-emerald-50"
            >
              Apri l’archivio locale
              <ArrowRight size={17} />
            </Link>
          </div>
        </article>

        <article className="rounded-[30px] border border-violet-200 bg-violet-50 p-6 sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-700 text-white">
            <Copy size={20} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">Invito tester pronto</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Il messaggio spiega durata, privacy, obiettivo e chiede un feedback sincero. Basterà sostituire il link quando la beta sarà pubblicata.
          </p>
          <button
            type="button"
            onClick={() => void copyTesterInvite()}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 text-sm font-bold text-white hover:bg-violet-800"
          >
            {inviteCopied ? <Check size={18} /> : <Copy size={18} />}
            {inviteCopied ? "Invito copiato" : "Copia invito tester"}
          </button>
        </article>
      </section>

      {activeJourney && (
        <section className="flex flex-col justify-between gap-4 rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <FileCheck2 size={18} />
            </span>
            <div>
              <p className="font-bold text-emerald-950">Pratica attiva: {activeJourney.property.name}</p>
              <p className="mt-1 text-sm text-emerald-800">
                Health Score {activeJourney.healthScore}/100 · puoi riprendere esattamente da dove eri rimasto.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/pilot"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Continua con Pilot
            <ArrowRight size={16} />
          </Link>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <ValueCard
          icon={ShieldCheck}
          title="Privacy dimostrabile"
          description="Dati, eventi del test e file restano nel browser. Nessun account, analytics esterno o database remoto."
        />
        <ValueCard
          icon={Sparkles}
          title="Valore prima della tecnologia"
          description="Testiamo chiarezza, priorità e fiducia senza OpenAI. L’IA verrà collegata soltanto quando avremo dimostrato il bisogno."
        />
        <ValueCard
          icon={MessageSquareText}
          title="Metriche utilizzabili"
          description="Sessioni, passaggi chiave, tempi e feedback vengono registrati localmente ed esportati per analizzare i primi test."
        />
      </section>

      <p className="text-center text-xs leading-5 text-slate-500">
        Versione sperimentale. I file locali non sostituiscono una copia sicura e le checklist non sostituiscono la verifica di un professionista. Leggi la{" "}
        <Link href="/privacy" className="font-bold text-blue-700 hover:underline">privacy della beta</Link>.
      </p>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={19} />
      </span>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function BetaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-[28px] bg-slate-200" />
      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="h-[500px] animate-pulse rounded-[32px] bg-slate-200" />
        <div className="h-[500px] animate-pulse rounded-[30px] bg-slate-100" />
      </div>
    </div>
  );
}
