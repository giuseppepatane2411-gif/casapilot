"use client";

import { useState } from "react";
import { LANGUAGE_LABELS } from "@/lib/remote-layer/labels";
import { approveMessageTranslation } from "@/lib/remote-layer/repository";
import type { LanguageCode, RemoteMessage } from "@/lib/remote-layer/types";

const SENSITIVITY_LABELS: Record<
  NonNullable<RemoteMessage["contentSensitivity"]>,
  string
> = {
  routine: "Conversazione ordinaria",
  technical: "Contenuto tecnico",
  financial: "Contenuto economico",
  legal: "Contenuto legale",
  official_document: "Documento ufficiale",
};

export default function TranslatedMessage({
  message,
  viewerLanguage,
  mine,
  showOriginalByDefault = true,
}: {
  message: RemoteMessage;
  viewerLanguage: LanguageCode;
  mine: boolean;
  showOriginalByDefault?: boolean;
}) {
  const canUseTranslation =
    message.translatedLanguage === viewerLanguage &&
    Boolean(message.translatedText) &&
    message.translationStatus !== "original_only";
  const sensitive = ["financial", "legal", "official_document"].includes(
    message.contentSensitivity ?? "routine",
  );
  const [showOriginal, setShowOriginal] = useState(
    sensitive ? true : showOriginalByDefault && !canUseTranslation,
  );
  const [approved, setApproved] = useState(
    message.translationStatus === "approved",
  );

  const visibleText =
    !showOriginal && canUseTranslation
      ? message.translatedText
      : message.originalText;

  const approve = () => {
    approveMessageTranslation(message.id);
    setApproved(true);
  };

  return (
    <div
      className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${
        mine
          ? "ml-auto bg-blue-600 text-white"
          : "bg-white text-slate-700"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {message.contentSensitivity ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              mine
                ? "bg-white/15 text-white"
                : sensitive
                  ? "bg-amber-50 text-amber-800"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {SENSITIVITY_LABELS[message.contentSensitivity]}
          </span>
        ) : null}
        {message.translationStatus === "needs_review" && !approved ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              mine
                ? "bg-amber-300/20 text-amber-50"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            Verifica consigliata
          </span>
        ) : null}
        {approved ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              mine
                ? "bg-emerald-300/20 text-emerald-50"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            Traduzione controllata
          </span>
        ) : null}
      </div>

      <p className="whitespace-pre-wrap leading-6">{visibleText}</p>

      {message.glossaryReferences && message.glossaryReferences.length > 0 ? (
        <div
          className={`mt-3 rounded-xl p-3 text-xs ${
            mine ? "bg-white/10" : "bg-blue-50 text-blue-800"
          }`}
        >
          <p className="font-semibold">Termini immobiliari riconosciuti</p>
          <p className="mt-1 leading-5">
            {message.glossaryReferences
              .map((reference) => reference.term)
              .join(" · ")}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-85">
        {canUseTranslation ? (
          <button
            type="button"
            onClick={() => setShowOriginal((value) => !value)}
            className="font-semibold underline underline-offset-2"
          >
            {showOriginal ? "Mostra traduzione" : "Mostra originale"}
          </button>
        ) : null}
        <span>
          {LANGUAGE_LABELS[message.originalLanguage]}
          {canUseTranslation
            ? ` → ${LANGUAGE_LABELS[viewerLanguage]}`
            : ""}
        </span>
        {message.translationMethod && message.translationMethod !== "none" ? (
          <span>
            Metodo: {message.translationMethod.replaceAll("_", " ")}
          </span>
        ) : null}
      </div>

      {message.translationStatus === "provider_required" &&
      message.originalLanguage !== viewerLanguage ? (
        <p className="mt-2 text-xs leading-5 opacity-75">
          Traduzione completa non disponibile nel test locale. CasaPilot mostra
          l'originale senza inventare il contenuto.
        </p>
      ) : null}

      {message.translationStatus === "original_only" ? (
        <p className="mt-2 text-xs leading-5 opacity-80">
          Per i documenti ufficiali fa fede l'originale. Una traduzione
          professionale può essere richiesta separatamente.
        </p>
      ) : null}

      {message.reviewRequired && canUseTranslation && !approved ? (
        <button
          type="button"
          onClick={approve}
          className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${
            mine
              ? "bg-white text-blue-700"
              : "bg-slate-950 text-white"
          }`}
        >
          Ho confrontato con l'originale
        </button>
      ) : null}

      {message.contactDataProtected ? (
        <p className="mt-2 text-xs opacity-75">
          CasaPilot ha protetto un recapito prima dello sblocco.
        </p>
      ) : null}
    </div>
  );
}
