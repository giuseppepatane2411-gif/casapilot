import type { Metadata } from "next";
import { Suspense } from "react";

import BetaSuccess from "@/components/beta/BetaSuccess";

export const metadata: Metadata = {
  title: "Percorso creato",
  description: "La prima missione del tuo percorso CasaPilot.",
};

export default function BetaSuccessPage() {
  return (
    <Suspense fallback={<div className="h-[620px] animate-pulse rounded-[30px] bg-slate-200" />}>
      <BetaSuccess />
    </Suspense>
  );
}
