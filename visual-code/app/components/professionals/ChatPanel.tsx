"use client";

import { useEffect, useState } from "react";
import {
  getOwnerRemotePreferences,
  getRemoteMessages,
  sendRemoteMessage,
} from "@/lib/remote-layer/repository";
import type { LanguageCode, RemoteMessage } from "@/lib/remote-layer/types";
import TranslatedMessage from "@/components/remote-layer/TranslatedMessage";

export default function ChatPanel({
  leadId,
  contactsUnlocked = false,
  role = "owner",
  ownerLanguage,
}: {
  leadId: string;
  contactsUnlocked?: boolean;
  role?: "owner" | "professional";
  ownerLanguage?: LanguageCode;
}) {
  const [messages, setMessages] = useState<RemoteMessage[]>([]);
  const [text, setText] = useState("");
  const preferences = getOwnerRemotePreferences();
  const viewerLanguage: LanguageCode =
    role === "owner"
      ? ownerLanguage ?? preferences.preferredLanguage
      : "it";

  const refresh = () => setMessages(getRemoteMessages(leadId));
  useEffect(refresh, [leadId]);

  const translationActive =
    preferences.communicationPreference !== "direct_only" &&
    preferences.translationEnabled;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">
            Chat della richiesta
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {contactsUnlocked
              ? "Contatti sbloccati"
              : "Recapiti protetti fino all'accettazione"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            translationActive
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {translationActive
            ? "Traduzione adattiva attiva"
            : "Comunicazione diretta"}
        </span>
      </div>

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nessun messaggio. Usa la chat per chiarimenti legati al preventivo.
          </p>
        ) : (
          messages.map((message) => (
            <TranslatedMessage
              key={message.id}
              message={message}
              viewerLanguage={viewerLanguage}
              mine={message.senderRole === role}
              showOriginalByDefault={
                preferences.showOriginalByDefault ?? true
              }
            />
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="Scrivi un chiarimento..."
          className="min-h-20 flex-1 rounded-xl border border-slate-200 px-4 py-3"
        />
        <button
          type="button"
          onClick={() => {
            if (!text.trim()) return;
            sendRemoteMessage({
              leadId,
              senderRole: role,
              senderId:
                role === "owner" ? "demo-owner" : "demo-professional",
              text: text.trim(),
              senderLanguage: viewerLanguage,
              targetLanguage:
                role === "owner"
                  ? "it"
                  : ownerLanguage ?? preferences.preferredLanguage,
              contactsUnlocked,
              communicationPreference:
                preferences.communicationPreference ?? "automatic",
            });
            setText("");
            refresh();
          }}
          className="self-end rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          Invia
        </button>
      </div>

      <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-500 sm:grid-cols-2">
        <p>
          Pilot classifica il contenuto prima di tradurlo. I messaggi ordinari
          possono essere tradotti automaticamente.
        </p>
        <p>
          Costi, contratti e documenti ufficiali mostrano l'originale e possono
          richiedere conferma.
        </p>
      </div>
    </div>
  );
}
