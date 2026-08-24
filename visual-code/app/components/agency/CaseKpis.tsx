type Counters = { documents:number; inquiries:number; visits:number; offers:number; portals:number; humanTouches:number; };
export default function CaseKpis({ counters }: { counters: Counters }) {
  const items=[["Documenti",counters.documents],["Contatti",counters.inquiries],["Visite",counters.visits],["Offerte",counters.offers],["Portali",counters.portals],["Interventi umani",counters.humanTouches]];
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label,value])=><div key={String(label)} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div>)}</section>;
}
