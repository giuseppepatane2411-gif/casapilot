"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type OwnerType = "person" | "organization";

export default function OwnerRegistrationPage() {
  const router = useRouter();
  const [ownerType, setOwnerType] = useState<OwnerType>("person");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [legalName, setLegalName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [registeredOffice, setRegisteredOffice] = useState("");
  const [representativeRole, setRepresentativeRole] = useState("");
  const [accepted, setAccepted] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!accepted) return;
    const profile = {
      role: "owner",
      ownerType,
      name,
      surname,
      email,
      phone,
      taxCode,
      legalName,
      vatNumber,
      registeredOffice,
      representativeRole,
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("casapilot_v73_owner_profile", JSON.stringify(profile));
    window.localStorage.setItem("casapilot_v73_session", JSON.stringify({ role: "owner", displayName: ownerType === "person" ? `${name} ${surname}`.trim() : legalName, email }));
    router.push("/dashboard/pilot?welcome=1");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/registrazione" className="text-sm font-semibold text-blue-600">← Cambia tipo di account</Link>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Area proprietario</span>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">Registrazione proprietario</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Chi è intestatario o gestisce l’immobile?</h1>
          <p className="mt-3 leading-7 text-slate-600">Non chiediamo se sei un professionista: qui scegli soltanto la natura del soggetto proprietario.</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setOwnerType("person")} className={`rounded-2xl border p-5 text-left transition ${ownerType === "person" ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
              <span className="font-semibold">Persona fisica</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">Un privato intestatario dell’immobile o una persona delegata.</span>
            </button>
            <button type="button" onClick={() => setOwnerType("organization")} className={`rounded-2xl border p-5 text-left transition ${ownerType === "organization" ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
              <span className="font-semibold">Società o altro soggetto giuridico</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">Società, holding, ente, fondazione o altra organizzazione.</span>
            </button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {ownerType === "person" ? (
              <>
                <Field label="Nome" value={name} onChange={setName} required />
                <Field label="Cognome" value={surname} onChange={setSurname} required />
                <Field label="Codice fiscale" value={taxCode} onChange={setTaxCode} />
              </>
            ) : (
              <>
                <Field label="Denominazione o ragione sociale" value={legalName} onChange={setLegalName} required wide />
                <Field label="Partita IVA o codice fiscale" value={vatNumber} onChange={setVatNumber} required />
                <Field label="Sede legale" value={registeredOffice} onChange={setRegisteredOffice} required />
                <Field label="Nome del rappresentante" value={name} onChange={setName} required />
                <Field label="Cognome del rappresentante" value={surname} onChange={setSurname} required />
                <Field label="Ruolo del rappresentante" value={representativeRole} onChange={setRepresentativeRole} placeholder="Amministratore, delegato..." required wide />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Telefono" type="tel" value={phone} onChange={setPhone} />
          </div>

          <label className="mt-7 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
            Confermo di avere titolo o delega per gestire i dati dell’immobile e accetto le condizioni d’uso della versione dimostrativa.
          </label>

          <button type="submit" disabled={!accepted || !email || !name || (ownerType === "person" ? !surname : !legalName || !vatNumber)} className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Continua con Pilot</button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false, wide = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; wide?: boolean }) {
  return (
    <label className={`grid gap-1.5 text-sm font-semibold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>
      {label}{required ? " *" : ""}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="min-h-12 rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
    </label>
  );
}
