import Link from "next/link";

type Props = {
  propertySlug?: string;
  caseId?: string;
  intent?: string;
  documentType?: string;
  title?: string;
  description?: string;
};

export default function GuimmiaAssistantCard({
  propertySlug,
  caseId,
  intent = "general",
  documentType,
  title = "Chiedi a Guimmia",
  description = "Guimmia conosce il contesto e può aiutarti a capire il prossimo passo.",
}: Props) {
  const params = new URLSearchParams();
  params.set("intent", intent);
  if (propertySlug) params.set("property", propertySlug);
  if (caseId) params.set("case", caseId);
  if (documentType) params.set("document", documentType);

  return (
    <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,.18)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black">G</div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.14em] text-blue-300">Guimmia 24/7</p>
          <h2 className="text-xl font-black">{title}</h2>
        </div>
      </div>

      <p className="mt-4 leading-7 text-slate-300">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
        <span className="rounded-full bg-white/10 px-3 py-2">Cosa devo fare adesso?</span>
        <span className="rounded-full bg-white/10 px-3 py-2">Manca qualche documento?</span>
        <span className="rounded-full bg-white/10 px-3 py-2">Spiegami il prossimo passaggio</span>
      </div>

      <Link
        href={`/guimmia?${params.toString()}`}
        className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
      >
        Parla con Guimmia →
      </Link>
    </section>
  );
}
