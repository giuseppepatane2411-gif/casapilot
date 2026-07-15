import Link from "next/link";
import { Compass } from "lucide-react";

type LogoProps = {
  size?: number;
  showText?: boolean;
};

export default function Logo({
  size = 22,
  showText = true,
}: LogoProps) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-4"
    >
      {/* Icona */}

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl">

        <Compass
          size={size}
          strokeWidth={2.2}
          className="text-slate-900 transition-transform duration-300 group-hover:rotate-12"
        />

      </div>

      {/* Testo */}

      {showText && (
        <div className="leading-none">

          <h1 className="text-[26px] font-extrabold tracking-[0.18em]">

            <span className="text-slate-950">
              CASA
            </span>

            <span className="text-blue-600">
              PILOT
            </span>

          </h1>

          <p className="mt-2 text-xs font-medium tracking-wide text-slate-500">

            Il tuo assistente immobiliare intelligente

          </p>

        </div>
      )}

    </Link>
  );
}