import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck, Sparkles } from "lucide-react";

import Logo from "@/components/brand/Logo";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 lg:grid-cols-[1fr_0.85fr]">
          <div className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10">
            <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
            <div className="relative">
              <Logo className="[&_span]:text-white" />
              <span className="mt-14 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold">
                <Sparkles size={14} />
                Accesso demo
              </span>
              <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
                Entra nello spazio CasaPilot.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                In questa fase beta non serve ancora un account: puoi provare dashboard, wizard e checklist direttamente nel browser.
              </p>

              <div className="mt-8 space-y-3 text-sm text-slate-200">
                <p className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-blue-300" />
                  Dati conservati localmente nel browser
                </p>
                <p className="flex items-center gap-3">
                  <Compass size={18} className="text-blue-300" />
                  Percorso guidato passo dopo passo
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-7 sm:p-10">
            <p className="text-sm font-semibold text-blue-600">CasaPilot Beta</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Continua senza account</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              L’autenticazione reale sarà collegata quando aggiungeremo database e profili utente.
            </p>

            <Link
              href="/dashboard/beta"
              className="group mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Apri la Beta Lab
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/"
              className="mt-3 inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Torna alla Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
