import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">

      <Container>

        <div className="flex h-20 items-center justify-between">

          <Link
            href="/"
            className="flex items-center gap-4"
          >

            {/* LOGO */}

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">

              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="white"
                  strokeWidth="1.8"
                />

                <path
                  d="M12 6 L15.8 12 L12 18 L8.2 12 Z"
                  fill="white"
                />
              </svg>

            </div>

            <div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Casa<span className="text-blue-600">Pilot</span>
              </h1>

              <p className="text-xs text-slate-500">
                L'assistente immobiliare intelligente
              </p>

            </div>

          </Link>

          <nav className="hidden items-center gap-10 md:flex">

            <Link
              href="/professionals"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Professionisti
            </Link>

            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Dashboard
            </Link>

          </nav>

        </div>

      </Container>

    </header>
  );
}