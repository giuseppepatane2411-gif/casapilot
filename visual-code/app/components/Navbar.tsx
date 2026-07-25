"use client";

import { useState } from "react";
import Link from "next/link";

import Container from "@/components/ui/Container";
import Logo from "@/components/brand/Logo";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <div className="shrink-0">
            <Logo />
          </div>

          {/* Menu desktop */}
          <nav
            className="hidden items-center gap-7 md:flex"
            aria-label="Navigazione principale"
          >
            <Link
              href="/#come-funziona"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              Come funziona
            </Link>

            <Link
              href="/professionals"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              Per i professionisti
            </Link>

            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            >
              Accedi
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md"
            >
              Inizia gratis
            </Link>
          </nav>

          {/* Pulsante menu mobile */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition-colors hover:bg-slate-50 md:hidden"
            aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="sr-only">
              {isMenuOpen ? "Chiudi menu" : "Apri menu"}
            </span>

            <div className="flex w-5 flex-col gap-1.5">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${
                  isMenuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />

              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-opacity duration-300 ${
                  isMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />

              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${
                  isMenuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {/* Menu mobile */}
        <div
          id="mobile-navigation"
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            isMenuOpen
              ? "max-h-[420px] border-t border-slate-200/70 opacity-100"
              : "max-h-0 border-t border-transparent opacity-0"
          }`}
        >
          <nav
            className="flex flex-col gap-1 py-4"
            aria-label="Navigazione mobile"
          >
            <Link
              href="/#come-funziona"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              Come funziona
            </Link>

            <Link
              href="/professionals"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              Per i professionisti
            </Link>

            <Link
              href="/login"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              Accedi
            </Link>

            <Link
              href="/login"
              onClick={closeMenu}
              className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-base font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Inizia gratis
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}