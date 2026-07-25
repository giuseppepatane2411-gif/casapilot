"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Sparkles } from "lucide-react";

import Container from "@/components/ui/Container";
import SearchBar from "@/components/home/SearchBar";
import QuickActions from "@/components/home/QuickActions";
import PilotConversation from "@/components/home/PilotConversation";

export default function Hero() {
  const [message, setMessage] = useState("");
  const [conversationStarted, setConversationStarted] = useState(false);

  const startPilot = () => {
    if (!message.trim()) return;

    setConversationStarted(true);
  };

  return (
    <section className="overflow-hidden bg-white pb-10 pt-4 sm:pb-14 sm:pt-6 lg:pb-20 lg:pt-8">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-4 py-12 shadow-[0_35px_100px_rgba(37,99,235,0.28)] sm:rounded-[36px] sm:px-8 sm:py-16 lg:rounded-[46px] lg:px-14 lg:py-20">
          {/* Decorazioni */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl sm:h-96 sm:w-96"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-28 h-[420px] w-[420px] rounded-full bg-indigo-950/30 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />

          <div className="relative z-10 mx-auto max-w-5xl">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md sm:text-sm">
                <Sparkles
                  size={16}
                  className="text-blue-100"
                  aria-hidden="true"
                />

                Pilot AI è pronto ad aiutarti
              </div>
            </div>

            {/* Titolo */}
            <h1 className="mx-auto mt-7 max-w-4xl text-center text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:mt-9 sm:text-6xl lg:text-[78px]">
              Il tuo assistente
              <span className="block text-blue-100">
                immobiliare intelligente.
              </span>
            </h1>

            {/* Sottotitolo */}
            <p className="mx-auto mt-6 max-w-3xl text-center text-base leading-7 text-blue-100/90 sm:mt-8 sm:text-xl sm:leading-9">
              Vendi o affitta il tuo immobile senza perderti tra documenti,
              scadenze e burocrazia. Racconta a Pilot cosa vuoi fare e lasciati
              guidare passo dopo passo.
            </p>

            {/* Barra Pilot */}
            <SearchBar
              message={message}
              setMessage={setMessage}
              startPilot={startPilot}
            />

            {/* Contenuto dinamico */}
            <div className="mt-6 sm:mt-8">
              {conversationStarted ? (
                <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:rounded-[30px] sm:p-6">
                  <PilotConversation message={message} />
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:rounded-[30px] sm:p-5">
                  <QuickActions />
                </div>
              )}
            </div>

            {/* Elementi fiducia */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-blue-100 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} aria-hidden="true" />
                Inizia gratuitamente
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} aria-hidden="true" />
                Nessun impegno
              </div>

              <div className="flex items-center gap-2">
                <Bot size={17} aria-hidden="true" />
                Assistenza passo dopo passo
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}