import type { Metadata } from "next";

import AccountPanel from "@/components/auth/AccountPanel";

export const metadata: Metadata = {
  title: "Account",
  description: "Gestisci il tuo profilo CasaPilot.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header>
        <p className="text-sm font-semibold text-blue-600">Profilo CasaPilot</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">
          Il tuo account
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Dati personali, tipo di profilo e stato professionale in un unico spazio.
        </p>
      </header>
      <AccountPanel />
    </div>
  );
}
