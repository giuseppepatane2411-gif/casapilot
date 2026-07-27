import Link from "next/link";
import { Compass } from "lucide-react";

type LogoProps = {
  showText?: boolean;
  showTagline?: boolean;
  compact?: boolean;
  className?: string;
};

export default function Logo({
  showText = true,
  showTagline = false,
  compact = false,
  className = "",
}: LogoProps) {
  const iconSize = compact ? 18 : 21;

  return (
    <Link
      href="/"
      aria-label="Vai alla Home di CasaPilot"
      className={`
        group
        inline-flex
        min-w-0
        items-center
        gap-3
        rounded-xl
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-600
        focus-visible:ring-offset-4
        ${className}
      `}
    >
      <span
        className={`
          relative
          flex
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-[14px]
          bg-slate-950
          text-white
          shadow-[0_10px_28px_rgba(15,23,42,0.18)]
          transition-all
          duration-300
          group-hover:-translate-y-0.5
          group-hover:bg-blue-600
          group-hover:shadow-[0_14px_34px_rgba(37,99,235,0.28)]
          ${
            compact
              ? "h-9 w-9"
              : "h-10 w-10 sm:h-11 sm:w-11"
          }
        `}
      >
        <span
          aria-hidden="true"
          className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-blue-500/50 blur-lg"
        />

        <Compass
          size={iconSize}
          strokeWidth={2.35}
          aria-hidden="true"
          className="relative z-10 transition-transform duration-500 group-hover:rotate-[24deg]"
        />
      </span>

      {showText && (
        <span className="min-w-0">
          <span
            className="
              block
              whitespace-nowrap
              [font-family:var(--font-brand)]
              text-[22px]
              font-bold
              leading-none
              tracking-[-0.055em]
              text-slate-950
              sm:text-[24px]
            "
          >
            Casa
            <span className="text-blue-600">Pilot</span>
          </span>

          {showTagline && (
            <span className="mt-1.5 hidden whitespace-nowrap text-[10px] font-medium tracking-[0.08em] text-slate-500 lg:block">
              IL TUO ASSISTENTE IMMOBILIARE
            </span>
          )}
        </span>
      )}
    </Link>
  );
}