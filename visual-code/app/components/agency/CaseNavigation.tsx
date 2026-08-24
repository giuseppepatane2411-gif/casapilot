import Link from "next/link";
export default function CaseNavigation({ listingId }: { listingId: string }) {
  const links = [
    ["Panoramica", `/dashboard/pratica/${listingId}`],
    ["Documenti", `/dashboard/pratica/${listingId}/documenti`],
    ["Pubblicazione", `/dashboard/pratica/${listingId}/pubblicazione`],
    ["Contatti", `/dashboard/pratica/${listingId}/contatti`],
    ["Visite", `/dashboard/pratica/${listingId}/visite`],
    ["Offerte", `/dashboard/pratica/${listingId}/offerte`],
  ];
  return <nav className="flex gap-2 overflow-x-auto pb-1">{links.map(([label,href])=><Link key={href} href={href} className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:text-blue-600">{label}</Link>)}</nav>;
}
