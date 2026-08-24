"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import Container from "@/components/ui/Container";
import Logo from "@/components/brand/Logo";

const navigation = [
  {
    label: "Come funziona",
    href: "/#come-funziona",
  },
  {
    label: "Guimmia",
    href: "/pilot",
  },
  {
    label: "Professionisti",
    href: "/professionals",
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <Container>
        <div className="flex h-[72px] items-center justify-between sm:h-[78px]">
          <Logo />

          <nav
            aria-label="Navigazione principale"
            className="hidden items-center gap-8 md:flex"
          >
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative py-2 text-[14px] font-medium text-slate-600 transition-colors hover:text-slate-950 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/login"
              className="text-[14px] font-semibold text-slate-700 transition-colors hover:text-blue-600"
            >
              Accedi
            </Link>

            <Link
              href="/register"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-[0_14px_30px_rgba(37,99,235,0.25)]"
            >
              Registrati gratis
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </nav>

          <button
            type="button"
            aria-label={menuOpen ? "Chiudi il menu" : "Apri il menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-colors hover:bg-slate-50 md:hidden"
          >
            {menuOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={21} aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      <div
        id="mobile-navigation"
        className={`overflow-hidden border-t border-slate-200/70 bg-white transition-all duration-300 md:hidden ${
          menuOpen
            ? "max-h-[520px] opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <Container>
          <nav aria-label="Navigazione mobile" className="flex flex-col py-4">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="flex min-h-12 items-center border-b border-slate-100 py-3 text-base font-medium text-slate-700 transition-colors hover:text-blue-600"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/login"
              onClick={closeMenu}
              className="mt-4 flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700"
            >
              Accedi
            </Link>

            <Link
              href="/register"
              onClick={closeMenu}
              className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Registrati gratis
              <ArrowRight size={16} />
            </Link>
          </nav>
        </Container>
      </div>
    </header>
  );
}

