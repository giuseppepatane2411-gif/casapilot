"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "./icons";

const NAVIGATION = [
  { label: "Panoramica", href: "/professionista", icon: "home" as const },
  { label: "Servizi", href: "/professionista/servizi", icon: "services" as const },
  { label: "Richieste", href: "/professionista/richieste", icon: "leads" as const },
  { label: "Preventivi", href: "/professionista/preventivi", icon: "quotes" as const },
  { label: "Messaggi", href: "/professionista/messaggi", icon: "messages" as const },
  { label: "Incarichi", href: "/professionista/incarichi", icon: "jobs" as const },
  { label: "Profilo", href: "/professionista/profilo", icon: "profile" as const },
];

function active(pathname: string, href: string) {
  if (href === "/professionista") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ProfessionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between px-4">
          <Link href="/professionista" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Icon name="pilot" className="h-5 w-5" />
            </span>
            CasaPilot Pro
          </Link>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Modalità professionista
          </span>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2">
          {NAVIGATION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${
                active(pathname, item.href)
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-6 py-6">
          <Link href="/professionista" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Icon name="pilot" className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">CasaPilot Pro</span>
              <span className="block text-xs text-slate-500">Sistema professionisti</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {NAVIGATION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active(pathname, item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Icon name="shield" className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wide">Ruoli separati</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Qui gestisci servizi, richieste, preventivi e incarichi. L’area proprietario resta separata e sempre accessibile.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Passa all’area proprietario
          </Link>
        </div>
      </aside>

      <div className="lg:pl-72">{children}</div>
    </div>
  );
}
