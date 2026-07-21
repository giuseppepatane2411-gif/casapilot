import Link from "next/link";

import Container from "@/components/ui/Container";
import Logo from "@/components/brand/Logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl">

      <Container>

        <div className="flex h-24 items-center justify-between">

          {/* Logo */}

          <Logo />

          {/* Menu */}

          <nav className="hidden items-center gap-10 md:flex">

            <Link
              href="/professionals"
              className="group relative text-[15px] font-medium text-slate-600 transition-all duration-300 hover:text-slate-950"
            >
              Per i professionisti

              <span className="absolute -bottom-2 left-0 h-[2px] w-0 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-full" />

            </Link>

            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-5 py-2 text-[15px] font-medium text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            >
              Accedi
            </Link>

          </nav>

        </div>

      </Container>

    </header>
  );
}