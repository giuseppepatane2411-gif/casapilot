"use client";

import { ArrowUpRight, Bot } from "lucide-react";

type SearchBarProps = {
  message: string;
  setMessage: (value: string) => void;
  startPilot: () => void;
};

export default function SearchBar({
  message,
  setMessage,
  startPilot,
}: SearchBarProps) {
  const canStart = message.trim().length > 0;

  return (
    <div className="mx-auto mt-9 w-full max-w-4xl sm:mt-12">
      <div className="rounded-[24px] border border-white/30 bg-white p-2 shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:rounded-full sm:p-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 sm:px-5 sm:py-0">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:flex">
              <Bot size={21} aria-hidden="true" />
            </div>

            <label htmlFor="pilot-message" className="sr-only">
              Descrivi cosa vuoi fare con il tuo immobile
            </label>

            <textarea
              id="pilot-message"
              value={message}
              rows={1}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  startPilot();
                }
              }}
              placeholder="Es. Voglio affittare il mio appartamento..."
              className="max-h-32 min-h-12 w-full resize-none bg-transparent py-3 text-base leading-6 text-slate-900 outline-none placeholder:text-slate-400 sm:min-h-14 sm:py-4 sm:text-lg"
            />
          </div>

          <button
            type="button"
            onClick={startPilot}
            disabled={!canStart}
            className="
              inline-flex
              min-h-14
              w-full
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-[18px]
              bg-blue-600
              px-6
              text-base
              font-semibold
              text-white
              shadow-[0_12px_30px_rgba(37,99,235,0.30)]
              transition-all
              duration-300
              hover:bg-blue-700
              hover:shadow-[0_16px_38px_rgba(37,99,235,0.40)]
              disabled:cursor-not-allowed
              disabled:bg-slate-300
              disabled:shadow-none
              sm:h-16
              sm:w-16
              sm:rounded-full
              sm:px-0
            "
            aria-label="Avvia Guimmia"
          >
            <span className="sm:hidden">Parla con Guimmia</span>
            <ArrowUpRight size={23} aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-xs leading-5 text-blue-100/80 sm:text-sm">
        Premi Invio per iniziare oppure Shift + Invio per andare a capo.
      </p>
    </div>
  );
}
