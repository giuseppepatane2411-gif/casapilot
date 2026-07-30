"use client";

import {
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";

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
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <div>
            <p className="text-sm font-semibold text-slate-950 sm:text-base">
              Il tuo percorso
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              Tutto ciò che serve, in un unico spazio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Apri le notifiche"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <Bell size={19} aria-hidden="true" />

            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 shadow-sm transition-colors hover:bg-slate-50 sm:px-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
              G
            </span>

            <span className="hidden text-sm font-semibold text-slate-800 sm:block">
              Giuseppe
            </span>

            <ChevronDown
              size={15}
              aria-hidden="true"
              className="hidden text-slate-400 sm:block"
            />
          </button>
        </div>
      </div>
    </header>
  );
}