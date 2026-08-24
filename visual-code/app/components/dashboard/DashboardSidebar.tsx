"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  FileText,
  Plus,
  Route,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";

import Logo from "@/components/brand/Logo";

type DashboardSidebarProps = {
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
};

const navigation = [
  { label: "Percorso", href: "/dashboard", icon: Route },
  { label: "I miei immobili", href: "/dashboard/properties", icon: Building2 },
  { label: "Documenti", href: "/dashboard/documents", icon: FileText },
  { label: "Professionisti", href: "/dashboard/professionals", icon: Users },
  { label: "Marketplace", href: "/dashboard/marketplace", icon: BriefcaseBusiness },
];

export default function DashboardSidebar({
  mobileMenuOpen,
  onCloseMobileMenu,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    if (href === "/dashboard/properties") return pathname.startsWith("/dashboard/properties");
    if (href === "/dashboard/documents") {
      return pathname.startsWith("/dashboard/documents") || pathname.startsWith("/dashboard/vault");
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi il menu"
        onClick={onCloseMobileMenu}
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Logo />
          <button
            type="button"
            aria-label="Chiudi il menu"
            onClick={onCloseMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 lg:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Il tuo spazio
          </p>
          <nav aria-label="Navigazione principale" className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobileMenu}
                  className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      active
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-950"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2.2} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <Link
              href="/dashboard/properties/new"
              onClick={onCloseMobileMenu}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus size={16} />
              Crea il tuo immobile
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <Link
            href="/dashboard/professional-profile"
            onClick={onCloseMobileMenu}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <BadgeCheck size={17} />
            Profilo professionale
          </Link>
          <Link
            href="/dashboard/account"
            onClick={onCloseMobileMenu}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <UserRound size={17} />
            Account
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={onCloseMobileMenu}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <Settings size={17} />
            Impostazioni
          </Link>
          <p className="mt-3 px-3 text-[11px] leading-5 text-slate-400">
            Guimmia · il tuo assistente immobiliare intelligente.
          </p>
        </div>
      </aside>
    </>
  );
}
