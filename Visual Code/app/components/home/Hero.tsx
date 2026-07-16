"use client";

import { useState } from "react";

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
    <section className="bg-white">
      <Container>

        <div className="mx-auto flex min-h-[85vh] max-w-5xl flex-col items-center justify-center py-24">

          {/* Titolo */}

          <h1 className="max-w-5xl text-center text-7xl font-semibold leading-[0.95] tracking-[-0.05em] text-slate-950">

            Il tuo assistente immobiliare

            <br />

            intelligente.

          </h1>

          {/* Sottotitolo */}

          <p className="mt-10 max-w-3xl text-center text-[22px] leading-10 font-normal text-slate-500">

            Vendi, affitta e gestisci i tuoi immobili con l'aiuto di
            <strong> Pilot AI</strong>, l'assistente che ti guida passo dopo
            passo.

          </p>

          {/* Search Bar */}

          <SearchBar
            message={message}
            setMessage={setMessage}
            startPilot={startPilot}
          />

          {/* Contenuto sotto la barra */}

          {conversationStarted ? (
            <PilotConversation message={message} />
          ) : (
            <QuickActions />
          )}

        </div>

      </Container>
    </section>
  );
}