import type { RemoteOperationPlan } from "@/lib/remote-layer/types";

const FEASIBILITY_LABELS: Record<RemoteOperationPlan["feasibility"], string> = {
  local_only: "Attività principalmente sul posto",
  remote_coordination: "Coordinabile a distanza",
  mostly_remote: "Quasi interamente a distanza",
  fully_remote: "Completamente a distanza",
};

const RESPONSIBLE_LABELS: Record<
  RemoteOperationPlan["steps"][number]["responsible"],
  string
> = {
  owner: "Proprietario",
  professional: "Professionista",
  local_contact: "Referente locale",
  pilot: "Pilot",
};

export default function RemoteOperationPlanCard({
  plan,
  compact = false,
}: {
  plan: RemoteOperationPlan;
  compact?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-violet-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            Piano operativo
          </p>
          <h3 className="mt-1 font-semibold">
            {FEASIBILITY_LABELS[plan.feasibility]}
          </h3>
          <p className="mt-2 text-sm leading-6 text-violet-800">
            {plan.summary}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">
          {plan.steps.length} passaggi
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <p className="rounded-xl bg-white/70 px-3 py-2">
          {plan.inspectionRequired ? "○" : "✓"} Sopralluogo{" "}
          {plan.inspectionRequired ? "previsto" : "non necessario"}
        </p>
        <p className="rounded-xl bg-white/70 px-3 py-2">
          {plan.ownerPresenceNeeded ? "○" : "✓"} Presenza proprietario{" "}
          {plan.ownerPresenceNeeded ? "da confermare" : "non obbligatoria"}
        </p>
        <p className="rounded-xl bg-white/70 px-3 py-2">
          {plan.delegationPossible ? "✓" : "○"} Delega{" "}
          {plan.delegationPossible ? "possibile" : "non prevista"}
        </p>
        <p className="rounded-xl bg-white/70 px-3 py-2">
          {plan.localContactUseful ? "○" : "✓"} Referente locale{" "}
          {plan.localContactUseful ? "utile" : "non necessario"}
        </p>
      </div>

      {!compact ? (
        <div className="mt-5 space-y-3">
          {plan.steps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-2xl border border-violet-100 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {step.title}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {RESPONSIBLE_LABELS[step.responsible]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {plan.warnings.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          {plan.warnings.map((warning) => (
            <p key={warning}>! {warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
