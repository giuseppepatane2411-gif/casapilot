"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowUpRight,
  Building2,
  FileText,
  Home,
  KeyRound,
  Search,
} from "lucide-react";

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
    title: "Acquistare",
    href: "/dashboard/buy",
    icon: Search,
  },
  {
    title: "Immobili",
    href: "/dashboard",
    icon: FileText,
  },
  {
    title: "Professionisti",
    href: "/professionals",
    icon: Building2,
  },
];

export default function Hero() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const startPilot = () => {
    router.push("/dashboard/sell");
  };

  return (
    <section className="bg-white">
      <Container>
        <div className="mx-auto flex min-h-[85vh] max-w-5xl flex-col items-center justify-center py-24">

          <div className="mb-8">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-700">
              PILOT
            </span>
          </div>

          <h1 className="max-w-4xl text-center text-6xl font-bold tracking-tight text-slate-900">
            L'assistente immobiliare
            <br />
            intelligente.
          </h1>

          <p className="mt-8 max-w-2xl text-center text-xl leading-9 text-slate-500">
            Vendi, affitta, acquista e gestisci i tuoi immobili
            con l'aiuto dell'intelligenza artificiale.
          </p>

          <div className="mt-14 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-100">

            <div className="flex items-center gap-3">

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    startPilot();
                  }
                }}
                className="flex-1 border-none bg-transparent px-5 py-4 text-lg outline-none"
                placeholder="Come posso aiutarti oggi?"
              />

              <Button
                onClick={startPilot}
                className="rounded-2xl px-6"
              >
                <ArrowUpRight size={20} />
              </Button>

            </div>

          </div>

          <p className="mt-12 text-sm uppercase tracking-[0.25em] text-slate-400">
            Oppure scegli un percorso
          </p>

          <div className="mt-8 grid w-full max-w-5xl grid-cols-2 gap-5 lg:grid-cols-5">

            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                >
                  <Card className="cursor-pointer text-center transition-all duration-200 hover:-translate-y-1">

                    <Icon
                      className="mx-auto mb-4 text-blue-600"
                      size={34}
                    />

                    <h3 className="font-semibold text-slate-900">
                      {action.title}
                    </h3>

                  </Card>
                </Link>
              );
            })}

          </div>

        </div>
      </Container>
    </section>
  );
}