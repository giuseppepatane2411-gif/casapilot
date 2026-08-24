"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";

import StepDocuments from "@/components/property-wizard/StepDocuments";
import StepLocation from "@/components/property-wizard/StepLocation";
import StepOperation from "@/components/property-wizard/StepOperation";
import StepProperty from "@/components/property-wizard/StepProperty";
import StepSummary from "@/components/property-wizard/StepSummary";
import WizardProgress from "@/components/property-wizard/WizardProgress";
import {
  INITIAL_WIZARD_DATA,
  WIZARD_STEPS,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import {
  filterDocumentsForJourney,
} from "@/lib/property-journey/scoring";
import {
  clearWizardDraft,
  createJourney,
  readWizardDraft,
  saveWizardDraft,
} from "@/lib/property-journey/storage";
import type {
  DocumentKey,
  OperationType,
  PropertyType,
  WizardData,
} from "@/lib/property-journey/types";

const LAST_STEP = WIZARD_STEPS.length;

export default function PropertyWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const currentStep = WIZARD_STEPS[step - 1];
  const requiredDocuments = useMemo(
    () => getRequiredDocuments(data.operation, data.propertyType),
    [data.operation, data.propertyType],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = readWizardDraft();

      if (draft) {
        setStep(Math.min(Math.max(draft.step, 1), LAST_STEP));
        setData({
          ...INITIAL_WIZARD_DATA,
          ...draft.data,
        });
        setDraftRestored(true);
      } else {
        const goal = searchParams.get("goal");
        if (goal === "sale") {
          setData({
            ...INITIAL_WIZARD_DATA,
            operation: goal,
          });
          setStep(2);
        } else if (goal === "rent") {
          setData(INITIAL_WIZARD_DATA);
          setStep(1);
        }
      }

      setDraftLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (!draftLoaded || isCreating) return;
    saveWizardDraft(step, data);
  }, [data, draftLoaded, isCreating, step]);

  function updateField<K extends keyof WizardData>(
    field: K,
    value: WizardData[K],
  ) {
    setValidationMessage("");

    setData((current) => {
      const nextData = {
        ...current,
        [field]: value,
      };

      if (field === "operation" || field === "propertyType") {
        nextData.documents = filterDocumentsForJourney(current.documents, {
          operation:
            field === "operation"
              ? (value as OperationType)
              : current.operation,
          propertyType:
            field === "propertyType"
              ? (value as PropertyType)
              : current.propertyType,
        });
      }

      return nextData;
    });
  }

  function toggleDocument(documentId: DocumentKey) {
    setValidationMessage("");
    setData((current) => ({
      ...current,
      documents: current.documents.includes(documentId)
        ? current.documents.filter((item) => item !== documentId)
        : [...current.documents, documentId],
    }));
  }

  function validateStep(targetStep: number) {
    if (targetStep === 1 && !data.operation) {
      return "Scegli il percorso immobiliare che vuoi avviare.";
    }

    if (targetStep === 2) {
      if (!data.propertyType) return "Seleziona la tipologia dell’immobile.";
      if (!data.surface.trim() || Number(data.surface) <= 0) {
        return "Inserisci una superficie indicativa valida.";
      }
      if (!data.occupancy) return "Indica la situazione attuale dell’immobile.";
    }

    if (targetStep === 3) {
      if (!data.country.trim()) return "Inserisci il Paese.";
      if (!data.city.trim()) return "Inserisci il Comune o la città.";
      if (!data.province.trim()) return "Inserisci la provincia.";
      if (!data.postalCode.trim()) return "Inserisci il CAP.";
      if (!data.address.trim()) return "Inserisci l’indirizzo dell’immobile.";
    }

    return "";
  }

  function goForward() {
    const message = validateStep(step);
    if (message) {
      setValidationMessage(message);
      return;
    }

    setValidationMessage("");
    setStep((current) => Math.min(current + 1, LAST_STEP));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setValidationMessage("");
    setStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editStep(targetStep: number) {
    setValidationMessage("");
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetWizard() {
    const confirmed = window.confirm(
      "Vuoi cancellare la bozza e ricominciare il percorso?",
    );

    if (!confirmed) return;

    clearWizardDraft();
    setStep(1);
    setData(INITIAL_WIZARD_DATA);
    setDraftRestored(false);
    setValidationMessage("");
  }

  function completeJourney() {
    const messages = [1, 2, 3]
      .map((targetStep) => validateStep(targetStep))
      .filter(Boolean);

    if (messages.length > 0) {
      setValidationMessage(messages[0]);
      return;
    }

    setIsCreating(true);

    try {
      const journey = createJourney(data);
      clearWizardDraft();
      router.push(`/dashboard?created=${journey.id}`);
    } catch {
      setValidationMessage(
        "Non siamo riusciti a creare il percorso. Controlla i dati e riprova.",
      );
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div className="mx-auto w-full max-w-[1380px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-950"
            >
              <ArrowLeft size={17} />
              Torna a Oggi
            </Link>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Sparkles size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-600">
                  Nuovo immobile
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
                  Parlaci del tuo immobile
                </h1>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={resetWizard}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-950 sm:self-auto"
          >
            <RotateCcw size={16} />
            Ricomincia
          </button>
        </header>

        {draftRestored && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Bozza ripristinata</p>
              <p className="mt-1 leading-6 text-emerald-800">
                Abbiamo recuperato le risposte salvate in questo browser.
              </p>
            </div>
          </div>
        )}

        <WizardProgress currentStep={step} operation={data.operation} />

        <div className="mx-auto max-w-4xl">
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-600">
                Passaggio {step} · {currentStep.label}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                {currentStep.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                {currentStep.description}
              </p>
            </div>

            <div className="p-5 sm:p-7">
              {step === 1 && (
                <StepOperation
                  value={data.operation}
                  onChange={(value) => updateField("operation", value)}
                />
              )}

              {step === 2 && (
                <StepProperty data={data} onChange={updateField} />
              )}

              {step === 3 && (
                <StepLocation data={data} onChange={updateField} />
              )}

              {step === 4 && (
                <StepDocuments
                  documents={requiredDocuments}
                  selectedDocuments={data.documents}
                  onToggle={toggleDocument}
                />
              )}

              {step === 5 && (
                <StepSummary data={data} onEditStep={editStep} />
              )}

              {validationMessage && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                >
                  {validationMessage}
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
                Indietro
              </button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                  <Save size={14} />
                  Salvataggio automatico
                </span>

                {step < LAST_STEP ? (
                  <button
                    type="button"
                    onClick={goForward}
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700"
                  >
                    Continua
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={completeJourney}
                    disabled={isCreating}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isCreating ? "Creazione in corso…" : "Vai al primo passo"}
                    {!isCreating && <CheckCircle2 size={18} />}
                  </button>
                )}
              </div>
            </footer>
          </section>

        </div>
      </div>
    </div>
  );
}
