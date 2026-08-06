"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProfessionalType = "individual" | "organization";

export default function ProfessionalRegistrationPage() {
  const router = useRouter();
  const [professionalType, setProfessionalType] = useState<ProfessionalType>("individual");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [accepted, setAccepted] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!accepted) return;
    const registration = {
      role: "professional",
      professionalType,
      displayName,
      legalName,
      contactName,
      contactRole,
      vatNumber,
      email,
      phone,
      profession,
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("casapilot_v73_professional_registration", JSON.stringify(registration));
    window.localStorage.setItem("casapilot_v73_session", JSON.stringify({ role: "professional", displayName: displayName || legalName, email }));
    router.push("/professionista/onboarding");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/registrazione" className="text-sm font-semibold text-blue-600">← Cambia tipo di account</Link>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">CasaPilot Pro</span>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Registrazione professionista</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Come è organizzata la tua attività?</h1>
          <p className="mt-3 leading-7 text-slate-600">In questo percorso non esiste l’opzione “privato”: scegli soltanto se operi individualmente o come organizzazione.</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setProfessionalType("individual")} className={`rounded-2xl border p-5 text-left transition ${professionalType === "individual" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <span className="font-semibold">Professionista individuale</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">Operi personalmente come libero professionista o autonomo.</span>
            </button>
            <button type="button" onClick={() => setProfessionalType("organization")} className={`rounded-2xl border p-5 text-left transition ${professionalType === "organization" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <span className="font-semibold">Impresa, studio o società</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">Rappresenti un’impresa, uno studio, un’agenzia o una società.</span>
            </button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {professionalType === "individual" ? (
              <>
                <Field label="Nome pubblico o professionale" value={displayName} onChange={setDisplayName} required wide />
                <Field label="Nome legale" value={legalName} onChange={setLegalName} />
              </>
            ) : (
              <>
                <Field label="Nome pubblico dell’attività" value={displayName} onChange={setDisplayName} required wide />
                <Field label="Ragione sociale" value={legalName} onChange={setLegalName} required wide />
                <Field label="Referente operativo" value={contactName} onChange={setContactName} required />
                <Field label="Ruolo del referente" value={contactRole} onChange={setContactRole} placeholder="Titolare, responsabile..." required />
              </>
            )}
            <Field label="Professione o settore" value={profession} onChange={setProfession} placeholder="Geometra, fotografo, impresa edile..." required wide />
            <Field label="Partita IVA" value={vatNumber} onChange={setVatNumber} required />
            <Field label="Email professionale" type="email" value={email} onChange={setEmail} required />
            <Field label="Telefono" type="tel" value={phone} onChange={setPhone} />
          </div>

          <label className="mt-7 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
            Confermo che i dati dell’attività sono corretti e accetto le regole di contatto e comportamento di CasaPilot Pro.
          </label>

          <button type="submit" disabled={!accepted || !displayName || !profession || !vatNumber || !email || (professionalType === "organization" && (!legalName || !contactName))} className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Continua la configurazione professionale</button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false, wide = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; wide?: boolean }) {
  return (
    <label className={`grid gap-1.5 text-sm font-semibold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>
      {label}{required ? " *" : ""}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="min-h-12 rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
    </label>
  );
}
