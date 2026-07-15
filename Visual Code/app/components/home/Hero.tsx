"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ArrowUpRight,
  Compass,
  Home,
  KeyRound,
  Users,
} from "lucide-react";

import Conversation from "@/components/pilot/Conversation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const actions = [
  {
    title: "Vendere",
    href: "/dashboard/sell",
    icon: Home,
  },
  {
    title: "Affittare",
    href: "/dashboard/rent",
    icon: KeyRound,
  },
  {
    title: "Trova un professionista",
    href: "/professionals",
    icon: Users,
  },
];

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
           <span className="text-slate-950">
           
          </span>

           <br />

          

          </h1>
          
          {/* Sottotitolo */}

          <p className="mt-10 max-w-3xl text-center text-[22px] leading-10 font-normal text-slate-500">

            Vendi, affitta e gestisci i tuoi immobili con l'aiuto di
            <strong> Pilot AI</strong>, l'assistente che ti guida passo dopo
            passo.

          </p>

          {/* Barra Pilot */}

          <div className="mt-16 w-full max-w-4xl rounded-[30px] border border-slate-200 bg-white/90 p-3 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex items-center gap-3">

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    startPilot();
                  }
                }}
                placeholder="Dimmi cosa vuoi fare con il tuo immobile..."
                className="flex-1 border-none bg-transparent px-8 py-5 text-lg text-slate-900 placeholder:text-slate-400 outline-none"
              />

              <Button
                onClick={startPilot}
                className="h-16 w-16 rounded-full bg-blue-600 transition-all duration-300 hover:scale-105 hover:bg-blue-700"
              >
                <ArrowUpRight size={20} />
              </Button>

            </div>

          </div>

                    {/* Quick Actions */}

          {!conversationStarted && (
            <>
              <p className="mt-12 text-sm uppercase tracking-[0.25em] text-slate-400">
                Oppure scegli da dove iniziare
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-8">

                {actions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                    >
                      <Card className="group relative w-72 rounded-[28px] border border-slate-200 bg-white p-8 text-left shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-slate-300 hover:shadow-2xl">
                        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 transition group-hover:bg-blue-50">

  <Icon
    size={28}
    className="text-slate-900 group-hover:text-blue-600"
  />

</div>

<h3 className="text-xl font-semibold text-slate-900">

  {action.title}

</h3>

<p className="mt-3 leading-7 text-slate-500">

  {action.title === "Vendere" &&
    "Pilot ti accompagna nella vendita passo dopo passo."}

  {action.title === "Affittare" &&
    "Gestisci documenti, contratto e inquilino in un unico posto."}

  {action.title === "Trova un professionista" &&
    "Geometri, notai, tecnici e agenti verificati."}

</p>

<div className="mt-8 flex items-center font-semibold text-blue-600">

  Scopri

  <ArrowUpRight
    size={18}
    className="ml-2 transition group-hover:translate-x-1"
  />

</div>

                      </Card>
                    </Link>
                  );
                })}

              </div>
            </>
          )}

          {/* Conversation */}

          {conversationStarted && (
            <Conversation message={message} />
          )}

        </div>

      </Container>
    </section>
  );
}