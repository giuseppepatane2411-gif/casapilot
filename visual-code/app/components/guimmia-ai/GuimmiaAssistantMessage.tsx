import AnswerActions from "@/components/guimmia-ai/AnswerActions";
import { answerMetadata } from "@/lib/guimmia-ai/answer-content";

import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

import type {
  GuimmiaAIMessage,
  GuimmiaAIReviewStatus,
} from "@/lib/guimmia-ai/types";

type GuimmiaAssistantMessageProps = {
  message: GuimmiaAIMessage;
  reviewStatus?: GuimmiaAIReviewStatus;
  reviewBusy?: boolean;
  notSaved?: boolean;
  onRequestReview: (message: GuimmiaAIMessage) => void;
};

function statusLabel(status?: GuimmiaAIReviewStatus) {
  const labels: Record<GuimmiaAIReviewStatus, string> = {
    SUBMITTED: "Richiesta inviata",
    IN_REVIEW: "Verifica in corso",
    COMPLETED: "Verifica completata",
    CLOSED: "Richiesta chiusa",
  };
  return status ? labels[status] : "";
}

function SafeAnswerText({ value }: { value: string }) {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-[15px] leading-7 text-slate-700">
      {blocks.map((block, index) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const bullets = lines.every((line) => /^[-•]\s+/.test(line));
        const numbered = lines.every((line) => /^\d+[.)]\s+/.test(line));

        if (bullets) {
          return (
            <ul key={index} className="space-y-2 pl-1">
              {lines.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{line.replace(/^[-•]\s+/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (numbered) {
          return (
            <ol key={index} className="space-y-2">
              {lines.map((line) => {
                const match = line.match(/^(\d+)[.)]\s+(.*)$/);
                return (
                  <li key={line} className="grid grid-cols-[28px_1fr] gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-black text-blue-700">
                      {match?.[1]}
                    </span>
                    <span>{match?.[2]}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={line}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function GuimmiaAssistantMessage({
  message,
  reviewStatus,
  reviewBusy = false,
  notSaved = false,
  onRequestReview,
}: GuimmiaAssistantMessageProps) {
  const answer = answerMetadata(message);
  const hasStructuredDetails =
    answer.nextAction ||
    answer.missingDocuments.length > 0 ||
    answer.warnings.length > 0 ||
    answer.followUpQuestions.length > 0;

  return (
    <article className="grid grid-cols-[38px_1fr] gap-3 sm:grid-cols-[44px_1fr] sm:gap-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20 sm:h-11 sm:w-11">
        <Sparkles size={18} />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-950">
            Guimmia
          </span>
          {answer.humanReviewRequired ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
              <ShieldCheck size={11} />
              Verifica consigliata
            </span>
          ) : (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
              Risposta preliminare
            </span>
          )}
        </div>

        <div className="mt-3 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {answer.title ? (
            <h3 className="mb-3 text-xl font-bold tracking-[-0.035em] text-slate-950">
              {answer.title}
            </h3>
          ) : null}

          <SafeAnswerText value={answer.reply} />

          {hasStructuredDetails ? (
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
              {answer.nextAction ? (
                <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <ArrowRight size={15} />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-blue-700">
                        Prossimo passo
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 text-slate-900">
                        {answer.nextAction}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {answer.missingDocuments.length ? (
                <section className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ClipboardList size={16} />
                    <p className="text-xs font-extrabold">
                      Documenti o dati da verificare
                    </p>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {answer.missingDocuments.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm leading-6 text-slate-600"
                      >
                        <CheckCircle2
                          size={15}
                          className="mt-1 shrink-0 text-blue-600"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {answer.followUpQuestions.length ? (
                <section className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <BookOpenText size={16} />
                    <p className="text-xs font-extrabold">
                      Per rendere la risposta più precisa
                    </p>
                  </div>
                  <ol className="mt-3 space-y-2">
                    {answer.followUpQuestions.map((item, index) => (
                      <li
                        key={item}
                        className="grid grid-cols-[22px_1fr] gap-2 text-sm leading-6 text-slate-600"
                      >
                        <span className="font-black text-blue-600">
                          {index + 1}.
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {answer.warnings.length ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle size={16} />
                    <p className="text-xs font-extrabold">Attenzione</p>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {answer.warnings.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm leading-6 text-amber-900"
                      >
                        <FileWarning size={14} className="mt-1 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          {answer.handoffReason ? (
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {answer.handoffReason}
            </p>
          ) : null}

          <AnswerActions message={message} notSaved={notSaved} />

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {answer.references.length ? (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                  <BookOpenText size={14} />
                  Base Guimmia · {answer.references.length} riferimenti
                </summary>
                <ul className="mt-3 max-w-xl space-y-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  {answer.references.map((reference) => (
                    <li key={reference.type + reference.code}>
                      <span className="font-bold text-slate-700">
                        {reference.title}
                      </span>
                      <span className="ml-1 text-slate-400">
                        · {reference.code}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <span className="text-[11px] text-slate-400">
                Verifica sempre le informazioni importanti.
              </span>
            )}

            <button
              type="button"
              onClick={() => onRequestReview(message)}
              disabled={
                reviewBusy ||
                reviewStatus === "SUBMITTED" ||
                reviewStatus === "IN_REVIEW"
              }
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
            >
              <UserRoundCheck size={15} />
              {reviewBusy
                ? "Invio…"
                : statusLabel(reviewStatus) || "Chiedi una verifica"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
