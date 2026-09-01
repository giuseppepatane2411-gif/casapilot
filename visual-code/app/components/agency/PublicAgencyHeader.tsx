"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import Logo from "@/components/brand/Logo";

const navigation = [
  { href: "/immobili", label: "Vetrina immobili" },
  { href: "/vendere", label: "Vendere" },
  { href: "/affittare", label: "Affittare" },
  { href: "/immobili?mercato=holiday", label: "Vacanze" },
  { href: "/servizi", label: "Servizi" },
];

export default function PublicAgencyHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-5 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Logo compact />

        <nav aria-label="Navigazione principale" className="hidden items-center gap-7 text-sm font-bold text-slate-700 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} className="transition hover:text-blue-600" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-extrabold text-slate-800 transition hover:bg-slate-100 sm:inline-flex"
          >
            Accedi
          </Link>
          <Link
            href="/valuta-immobile"
            className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
          >
            Valuta il tuo immobile
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Chiudi il menu" : "Apri il menu"}
            aria-expanded={menuOpen}
            aria-controls="agency-mobile-navigation"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50 lg:hidden"
          >
            {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="agency-mobile-navigation"
        className={`overflow-hidden border-t bg-white transition-all duration-300 lg:hidden ${
          menuOpen
            ? "max-h-[520px] border-slate-200 opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <nav aria-label="Navigazione mobile" className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-12 items-center border-b border-slate-100 py-3 text-base font-bold text-slate-700 transition hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-800"
            >
              Accedi
            </Link>
            <Link
              href="/valuta-immobile"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white"
            >
              Valuta il tuo immobile
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
