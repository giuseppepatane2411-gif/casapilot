"use client";

import Link from "next/link";
import { Bot, Building2, FileText, Route } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { label: "Percorso", href: "/dashboard", icon: Route },
  { label: "Immobili", href: "/dashboard/properties", icon: Building2 },
  { label: "Documenti", href: "/dashboard/documents", icon: FileText },
  { label: "Pilot", href: "/dashboard/pilot", icon: Bot },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  if (href === "/dashboard/properties") return pathname.startsWith("/dashboard/properties");
  if (href === "/dashboard/documents") {
    return pathname.startsWith("/dashboard/documents") || pathname.startsWith("/dashboard/vault");
  }
  return pathname.startsWith(href);
}

export default function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition-colors ${
                active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon size={19} strokeWidth={2.2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
