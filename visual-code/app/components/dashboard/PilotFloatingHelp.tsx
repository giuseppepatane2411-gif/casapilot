"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, MessageCircleMore } from "lucide-react";

export default function PilotFloatingHelp() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard/pilot")) return null;

  return (
    <Link
      href="/dashboard/pilot"
      className="group fixed bottom-6 right-6 z-30 hidden items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-2xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-blue-700 lg:flex"
      aria-label="Chiedi a Guimmia"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        <Bot size={18} />
      </span>
      <span className="text-left">
        <span className="block text-xs font-bold">Hai un dubbio?</span>
        <span className="block text-[11px] text-slate-300 group-hover:text-blue-100">Chiedi a Guimmia</span>
      </span>
      <MessageCircleMore size={16} className="text-slate-400 group-hover:text-white" />
    </Link>
  );
}
