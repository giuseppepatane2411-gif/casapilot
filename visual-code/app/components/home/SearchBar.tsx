"use client";

import { ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/Button";

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
  return (
    <div className="mt-14 w-full max-w-5xl">

      <div className="
        flex items-center
        rounded-full
        border border-slate-200
        bg-white
        pl-8
        pr-3
        py-3
        shadow-[0_20px_60px_rgba(15,23,42,.08)]
      ">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              startPilot();
            }
          }}
          placeholder="Dimmi cosa vuoi fare con il tuo immobile..."
          className="
            flex-1
            bg-transparent
            text-lg
            outline-none
            placeholder:text-slate-400
          "
        />

        <Button
          onClick={startPilot}
          className="
            h-16
            w-16
            rounded-full
            bg-blue-600
            hover:bg-blue-700
          "
        >
          <ArrowUpRight size={24} />
        </Button>

      </div>

    </div>
  );
}