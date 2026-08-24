import Link from "next/link";
import { Compass, ShieldCheck, Sparkles } from "lucide-react";

import Logo from "@/components/brand/Logo";

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10 lg:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
            />

            <div className="relative flex h-full flex-col">
              <Logo className="[&_span]:text-white" />

              <div className="my-auto py-12">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <Sparkles size={14} />
                  Il tuo spazio immobiliare
                </span>
                <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
                  Tutta la pratica, un passo alla volta.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Crea il tuo profilo, organizza gli immobili e lascia che Guimmia
                  scelga la prossima azione utile in base al tuo obiettivo.
                </p>

                <div className="mt-8 space-y-3 text-sm text-slate-200">
                  <p className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-blue-300" />
                    Accesso personale protetto
                  </p>
                  <p className="flex items-center gap-3">
                    <Compass size={18} className="text-blue-300" />
                    Percorso adattato a vendita o affitto
                  </p>
                </div>
              </div>

              <Link
                href="/"
                className="text-sm font-semibold text-slate-300 hover:text-white"
              >
                ← Torna alla Home
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

