import Link from "next/link";
import { ArrowRight, Bot, Sparkles } from "lucide-react";

type PilotCardProps = {
  title?: string;
  message?: string;
  suggestion?: string;
  href?: string;
};

export default function PilotCard({
  title = "Ciao.",
  message = "Quando crei un percorso, userò i suoi dati per proporti la prossima attività utile.",
  suggestion = "Inizia dalle informazioni che hai già: potrai completare il resto con calma.",
  href = "/dashboard/pilot",
}: PilotCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-7">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-600/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <Sparkles size={14} />
            Pilot OS
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <Bot size={20} />
          </span>
        </div>

        <h2 className="mt-7 text-2xl font-bold tracking-[-0.04em]">{title}</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-300">{message}</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">
            Suggerimento
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{suggestion}</p>
        </div>

        <Link
          href={href}
          className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
        >
          Apri Pilot
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
