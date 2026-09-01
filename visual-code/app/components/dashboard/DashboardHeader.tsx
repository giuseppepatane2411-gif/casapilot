"use client";

import Link from "next/link";
import { Menu, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

type DashboardHeaderProps = { onOpenMobileMenu: () => void };

function getSection(pathname: string) {
  if (pathname.startsWith("/dashboard/properties")) {
    return { title: "I miei immobili", subtitle: "Dati e pratiche immobiliari" };
  }
  if (pathname.startsWith("/dashboard/documents") || pathname.startsWith("/dashboard/vault")) {
    return { title: "Documenti", subtitle: "Cosa hai e cosa manca" };
  }
  if (pathname.startsWith("/dashboard/pilot")) {
    return { title: "Guimmia", subtitle: "Chiedi quello che non è chiaro" };
  }
  if (pathname.startsWith("/dashboard/professionals")) {
    return { title: "Servizi", subtitle: "Supporto per il tuo immobile" };
  }
  if (pathname.startsWith("/dashboard/account")) {
    return { title: "Account", subtitle: "Profilo e accesso" };
  }
  if (pathname.startsWith("/dashboard/settings")) {
    return { title: "Impostazioni", subtitle: "Dati e preferenze" };
  }
  return { title: "Percorso", subtitle: "Un passo alla volta" };
}

export default function DashboardHeader({ onOpenMobileMenu }: DashboardHeaderProps) {
  const pathname = usePathname();
  const section = getSection(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Apri il menu"
            onClick={onOpenMobileMenu}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
          >
            <Menu size={19} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-950">{section.title}</p>
            <p className="hidden text-xs text-slate-500 sm:block">{section.subtitle}</p>
          </div>
        </div>
        <Link
          href="/dashboard/account"
          aria-label="Apri account"
          className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-700"
        >
          <UserRound size={16} />
          <span className="hidden sm:inline">Account</span>
        </Link>
      </div>
    </header>
  );
}
