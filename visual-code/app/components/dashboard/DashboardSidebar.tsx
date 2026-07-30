"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Building2,
  FileText,
  FolderLock,
  Home,
  LayoutDashboard,
  Plus,
  Rocket,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import Logo from "@/components/brand/Logo";

type DashboardSidebarProps = {
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
};

const mainNavigation = [
  {
    label: "Test Flight",
    href: "/dashboard/beta",
    icon: Rocket,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "I miei immobili",
    href: "/dashboard/properties",
    icon: Building2,
  },
  {
    label: "Nuovo percorso",
    href: "/dashboard/properties/new",
    icon: Plus,
    highlighted: true,
  },
  {
    label: "Documenti",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    label: "Archivio locale",
    href: "/dashboard/vault",
    icon: FolderLock,
  },
  {
    label: "Pilot OS",
    href: "/dashboard/pilot",
    icon: Bot,
  },
  {
    label: "Feedback beta",
    href: "/dashboard/feedback",
    icon: MessageSquareText,
  },
  {
    label: "Professionisti",
    href: "/dashboard/professionals",
    icon: Users,
  },
];

const secondaryNavigation = [
  {
    label: "Impostazioni",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Privacy beta",
    href: "/privacy",
    icon: ShieldCheck,
  },
  {
    label: "Torna alla Home",
    href: "/",
    icon: Home,
  },
];

export default function DashboardSidebar({
  mobileMenuOpen,
  onCloseMobileMenu,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    if (href === "/dashboard/properties/new") {
      return pathname === href;
    }

    if (href === "/dashboard/properties") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          pathname !== "/dashboard/properties/new")
      );
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi il menu"
        onClick={onCloseMobileMenu}
        className={`
          fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm
          transition-opacity duration-300 lg:hidden
          ${
            mobileMenuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col
          border-r border-slate-200 bg-white
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-slate-100 px-5">
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

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Il tuo spazio
          </p>

          <nav
            aria-label="Navigazione Dashboard"
            className="space-y-1.5"
          >
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobileMenu}
                  className={`
                    group flex min-h-12 items-center gap-3 rounded-2xl
                    px-3.5 py-3 text-sm font-semibold transition-all
                    ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : item.highlighted
                          ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10 hover:bg-blue-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }
                  `}
                >
                  <span
                    className={`
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
                      ${
                        active
                          ? "bg-blue-600 text-white"
                          : item.highlighted
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-950"
                      }
                    `}
                  >
                    <Icon size={17} strokeWidth={2.2} />
                  </span>

                  <span>{item.label}</span>

                  {item.highlighted && (
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                      Nuovo
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4">
          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobileMenu}
                  className={`
                    flex min-h-11 items-center gap-3 rounded-xl px-3
                    text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-slate-100 text-slate-950"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              B
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                Utente beta
              </p>

              <p className="truncate text-xs text-slate-500">
                Beta gratuita
              </p>
            </div>

            <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>
    </>
  );
}