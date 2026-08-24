import Link from "next/link";
import type { CaseTask } from "@/lib/agency/caseProgress";

export default function NextActionCard({ task }: { task: CaseTask | null }) {
  if (!task) {
    return (
      <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-xs font-black uppercase tracking-[.14em] text-emerald-700">Cosa devo fare adesso?</p>
        <h2 className="mt-2 text-2xl font-black text-emerald-950">Per il momento non hai attività urgenti.</h2>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-blue-200 bg-blue-50 p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.14em] text-blue-700">Cosa devo fare adesso?</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-.025em] text-slate-950">{task.title}</h2>
      {task.why_it_matters ? <p className="mt-3 max-w-2xl leading-7 text-slate-600">{task.why_it_matters}</p> : null}
      {task.action_url ? (
        <Link href={task.action_url} className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700">Continua →</Link>
      ) : (
        <Link href="/guimmia?intent=case" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700">Continua con Guimmia →</Link>
      )}
    </section>
  );
}
