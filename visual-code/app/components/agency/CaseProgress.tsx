import type { CaseTask } from "@/lib/agency/caseProgress";
import { progressPercent } from "@/lib/agency/caseProgress";

export default function CaseProgress({ tasks }: { tasks: CaseTask[] }) {
  const percent = progressPercent(tasks);
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Avanzamento pratica</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{percent}% completato</h2>
        </div>
        <div className="text-sm font-bold text-slate-500">
          {tasks.filter((x) => x.status === "done").length}/{tasks.length} attività
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
              task.status === "done" ? "bg-emerald-100 text-emerald-700" :
              task.status === "blocked" ? "bg-amber-100 text-amber-700" :
              "bg-blue-100 text-blue-700"
            }`}>
              {task.status === "done" ? "✓" : "•"}
            </div>
            <div>
              <p className="font-black text-slate-900">{task.title}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[.08em] text-slate-400">{task.category}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
