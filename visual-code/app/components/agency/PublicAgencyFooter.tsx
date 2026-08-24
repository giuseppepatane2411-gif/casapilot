import Link from "next/link";
import GuimmiaWordmark from "@/components/brand/GuimmiaWordmark";

export default function PublicAgencyFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <GuimmiaWordmark tagline />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
            La nostra agenzia immobiliare online ti accompagna nella vendita,
            nell’affitto e nella ricerca della casa giusta.
          </p>
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">Immobiliare</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <Link className="block hover:text-blue-600" href="/immobili">Immobili</Link>
            <Link className="block hover:text-blue-600" href="/immobili?mercato=holiday">Vacanze</Link>
            <Link className="block hover:text-blue-600" href="/vendere">Vendere</Link>
            <Link className="block hover:text-blue-600" href="/affittare">Affittare</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">Guimmia</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <Link className="block hover:text-blue-600" href="/prezzi">Prezzi</Link>
            <Link className="block hover:text-blue-600" href="/guimmia">Chiedi a Guimmia</Link>
            <Link className="block hover:text-blue-600" href="/privacy">Privacy</Link>
            <Link className="block hover:text-blue-600" href="/terms">Termini</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
