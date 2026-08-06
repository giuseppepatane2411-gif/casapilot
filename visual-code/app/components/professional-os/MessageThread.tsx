"use client";

import { useEffect, useState } from "react";
import {
  getOwnerRemotePreferences,
  getRemoteMessages,
  sendRemoteMessage,
} from "@/lib/remote-layer/repository";
import type { LanguageCode, RemoteMessage } from "@/lib/remote-layer/types";
import TranslatedMessage from "@/components/remote-layer/TranslatedMessage";
import { Button } from "./ui";

export default function MessageThread({
  leadId,
  ownerLanguage,
  contactsUnlocked = false,
}: {
  leadId: string;
  ownerLanguage: LanguageCode;
  contactsUnlocked?: boolean;
}) {
  const [messages, setMessages] = useState<RemoteMessage[]>([]);
  const [text, setText] = useState("");
  const preferences = getOwnerRemotePreferences();

  const refresh = () => setMessages(getRemoteMessages(leadId));
  useEffect(refresh, [leadId]);

  const send = () => {
    if (!text.trim()) return;
    sendRemoteMessage({
      leadId,
      senderRole: "professional",
      senderId: "current-user",
      text: text.trim(),
      senderLanguage: "it",
      targetLanguage: ownerLanguage,
      contactsUnlocked,
      communicationPreference:
        preferences.communicationPreference ?? "automatic",
    });
    setText("");
    refresh();
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Conversazione protetta</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {contactsUnlocked
              ? "I contatti sono stati sbloccati."
              : "Email, numeri e link esterni vengono oscurati prima dell'accettazione."}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Originale sempre disponibile
        </span>
      </div>

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nessun messaggio. Puoi chiedere i chiarimenti necessari al
            preventivo.
          </p>
        ) : (
          messages.map((message) => (
            <TranslatedMessage
              key={message.id}
              message={message}
              viewerLanguage="it"
              mine={message.senderRole === "professional"}
              showOriginalByDefault
            />
          ))
        )}
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder="Scrivi in italiano. Pilot conserverà l'originale e applicherà la regola corretta in base al contenuto."
        className="mt-4 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
      <div className="mt-3 flex justify-end">
        <Button disabled={!text.trim()} onClick={send}>
          Invia messaggio
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Una traduzione non sostituisce il testo originale. Per contenuti legali,
        economici o documenti ufficiali CasaPilot richiede un controllo più
        prudente.
      </p>
    </section>
  );
}
