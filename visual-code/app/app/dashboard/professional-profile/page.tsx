import type { Metadata } from "next";

import ProfessionalProfilePanel from "@/components/account/ProfessionalProfilePanel";

export const metadata: Metadata = {
  title: "Profilo professionale",
  description: "Gestisci attività, territorio e verifica del tuo profilo professionale CasaPilot.",
};

export default function ProfessionalProfilePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header>
        <p className="text-sm font-semibold text-blue-600">Rete professionale</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">Il tuo profilo professionale</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Dati dell’attività, zone servite, visibilità e stato della verifica in un unico spazio.
        </p>
      </header>
      <ProfessionalProfilePanel />
    </div>
  );
}
