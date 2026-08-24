import Link from "next/link";
import GuimmiaWordmark from "@/components/brand/GuimmiaWordmark";

export default function PublicAgencyHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Guimmia home">
          <GuimmiaWordmark compact />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-700 md:flex">
          <Link className="hover:text-blue-600" href="/immobili">Immobili</Link>
          <Link className="hover:text-blue-600" href="/vendere">Vendere</Link>
          <Link className="hover:text-blue-600" href="/affittare">Affittare</Link>
          <Link className="hover:text-blue-600" href="/servizi">Servizi</Link>
                  <Link className="hover:text-blue-600" href="/prezzi">Prezzi</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-extrabold text-slate-800 hover:bg-slate-100 sm:inline-flex"
          >
            Accedi
          </Link>
          <Link
            href="/guimmia"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700"
          >
            Chiedi a Guimmia
          </Link>
        </div>
      </div>
    </header>
  );
}
