import {
  BadgeEuro,
  BedDouble,
  Check,
  Clock3,
  GraduationCap,
  KeyRound,
} from "lucide-react";

import { OPERATION_OPTIONS } from "@/lib/property-journey/constants";
import type { OperationType } from "@/lib/property-journey/types";

type StepOperationProps = {
  value: OperationType | "";
  onChange: (value: OperationType) => void;
};

const iconByOperation = {
  sale: BadgeEuro,
  rent: KeyRound,
  rent_long_term: KeyRound,
  rent_transitory: Clock3,
  rent_student: GraduationCap,
  rent_room: BedDouble,
  rent_tourist_short: BedDouble,
};

export default function StepOperation({
  value,
  onChange,
}: StepOperationProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {OPERATION_OPTIONS.map((option) => {
        const Icon = iconByOperation[option.id];
        const selected = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={`group relative min-h-60 rounded-[26px] border p-6 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
              selected
                ? "border-blue-500 bg-blue-50/70 shadow-lg shadow-blue-600/10"
                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            }`}
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white"
              }`}
            >
              <Icon size={25} />
            </span>

            <span className="mt-7 block text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
              {option.eyebrow}
            </span>
            <span className="mt-2 block text-2xl font-bold text-slate-950">
              {option.title}
            </span>
            <span className="mt-3 block text-sm leading-6 text-slate-500">
              {option.description}
            </span>

            <span
              className={`absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                selected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-transparent"
              }`}
            >
              <Check size={16} strokeWidth={2.8} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
