"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import { getAllRemoteMessages } from "@/lib/remote-layer/repository";
import { LANGUAGE_LABELS } from "@/lib/remote-layer/labels";
import type { ProfessionalOsState } from "@/lib/professional-os/types";
import type { RemoteMessage } from "@/lib/remote-layer/types";
import { Badge, EmptyState, Heading, Page } from "./ui";

export default function MessagesCenter() {
  const [state, setState] = useState<ProfessionalOsState | null>(null);
  const [messages, setMessages] = useState<RemoteMessage[]>([]);

  useEffect(() => {
    setState(loadProfessionalState());
    setMessages(getAllRemoteMessages());
  }, []);

  const conversations = useMemo(() => {
    if (!state) return [];
    const leadIds = Array.from(new Set(messages.map((message) => message.leadId)));

    return leadIds
      .map((leadId) => {
        const lead = state.leads.find((item) => item.id === leadId);
        const thread = messages.filter((message) => message.leadId === leadId);
        return { lead, messages: thread, last: thread[thread.length - 1] };
      })
      .filter(
        (
          item,
        ): item is {
          lead: NonNullable<typeof item.lead>;
          messages: RemoteMessage[];
          last: RemoteMessage;
        } => Boolean(item.lead && item.last),
      )
      .sort(
        (a, b) =>
          new Date(b.last.createdAt).getTime() -
          new Date(a.last.createdAt).getTime(),
      );
  }, [messages, state]);

  return (
    <Page>
      <Heading
        eyebrow="Comunicazioni tracciate"
        title="Messaggi"
        description="Le conversazioni sono organizzate per lead. Recapiti, testo originale e traduzione rimangono tracciati separatamente."
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="Nessuna conversazione"
          description="I chiarimenti sulle richieste compariranno qui senza mescolarsi tra lead diverse."
        />
      ) : (
        <div className="space-y-3">
          {conversations.map(({ lead, messages: thread, last }) => (
            <Link
              key={lead.id}
              href={`/professionista/richieste/${lead.id}`}
              className="block rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-blue-300"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">{thread.length} messaggi</Badge>
                    <Badge>{LANGUAGE_LABELS[lead.ownerLanguage]}</Badge>
                    {thread.some((message) => message.contactDataProtected) ? (
                      <Badge tone="warning">Recapito protetto</Badge>
                    ) : null}
                    {thread.some((message) => message.translatedText) ? (
                      <Badge tone="success">Traduzione disponibile</Badge>
                    ) : null}
                    {thread.some(
                      (message) =>
                        message.reviewRequired &&
                        message.translationStatus !== "approved",
                    ) ? (
                      <Badge tone="warning">Traduzione da controllare</Badge>
                    ) : null}
                    {thread.some(
                      (message) =>
                        message.contentSensitivity === "official_document",
                    ) ? (
                      <Badge tone="danger">Documento originale</Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 font-semibold">
                    {findService(lead.serviceId)?.name}
                  </h2>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                    {last.translatedLanguage === "it" && last.translatedText
                      ? last.translatedText
                      : last.originalText}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(last.createdAt).toLocaleString("it-IT")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
