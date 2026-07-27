"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Sparkles } from "lucide-react";

import Container from "@/components/ui/Container";
import SearchBar from "@/components/home/SearchBar";
import PilotConversation from "@/components/home/PilotConversation";

export default function Hero() {
  const [message, setMessage] = useState("");
  const [conversationStarted, setConversationStarted] = useState(false);

  const startPilot = () => {
    if (!message.trim()) return;
    setConversationStarted(true);
  };

  return (
    <section className="overflow-hidden bg-white px-3 pb-8 pt-3 sm:px-4 sm:pb-12 sm:pt-5 lg:pb-16">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 py-10 shadow-[0_28px_80px_rgba(37,99,235,0.24)] sm:rounded-[34px] sm:px-8 sm:py-14 lg:rounded-[44px] lg:px-14 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-28 h-[420px] w-[420px] rounded-full bg-indigo-950/30 blur-3xl"
          />

          <div className="relative z-10 mx-auto max-w-5xl">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md sm:px-4 sm:text-sm">
                <Sparkles size={15} aria-hidden="true" />
                Pilot AI è pronto ad aiutarti
              </div>
            </div>

            <h1 className="mx-auto mt-6 max-w-4xl text-center text-[38px] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:mt-8 sm:text-6xl lg:text-[76px]">
              Il tuo assistente
              <span className="block text-blue-100">
                immobiliare intelligente.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-center text-base leading-7 text-blue-100/90 sm:mt-7 sm:text-xl sm:leading-9">
              Vendi o affitta il tuo immobile senza perderti tra documenti,
              scadenze e burocrazia. Racconta a Pilot cosa vuoi fare e lasciati
              guidare passo dopo passo.
            </p>

            <SearchBar
              message={message}
              setMessage={setMessage}
              startPilot={startPilot}
            />

            {conversationStarted && (
              <div className="mt-5 overflow-hidden rounded-[22px] border border-white/20 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.16)] sm:mt-7 sm:rounded-[28px] sm:p-6">
                <PilotConversation message={message} />
              </div>
            )}

            <div className="mt-7 flex flex-col items-center justify-center gap-2.5 text-sm text-blue-100 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} aria-hidden="true" />
                Inizia gratuitamente
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} aria-hidden="true" />
                Nessun impegno
              </div>

              <div className="flex items-center gap-2">
                <Bot size={16} aria-hidden="true" />
                Assistenza passo dopo passo
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}