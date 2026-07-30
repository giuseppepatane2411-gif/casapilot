"use client";

import Link from "next/link";
import { FlaskConical, HardDrive, Menu } from "lucide-react";

type DashboardHeaderProps = {
  onOpenMobileMenu: () => void;
};

export default function DashboardHeader({
  onOpenMobileMenu,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 xl:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Apri il menu"
            onClick={onOpenMobileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <div>
            <p className="text-sm font-semibold text-slate-950 sm:text-base">
              CasaPilot Beta
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Prova, completa una missione e condividi il feedback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 md:inline-flex">
            <HardDrive size={15} />
            Dati locali
          </span>

          <Link
            href="/dashboard/beta"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-600"
          >
            <FlaskConical size={17} />
            <span className="hidden sm:inline">Beta Lab</span>
          </Link>

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            B
          </span>
        </div>
      </div>
    </header>
  );
}
