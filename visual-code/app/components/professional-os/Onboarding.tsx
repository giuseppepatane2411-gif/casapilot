"use client";

import Link from "next/link";
import { useState } from "react";
import { saveIdentity } from "@/lib/professional-os/repository";
import type {
  ProfessionalAccountType,
  ProfessionalIdentity,
  VerificationItem,
} from "@/lib/professional-os/types";
import {
  LANGUAGE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  SUPPORTED_LANGUAGES,
} from "@/lib/remote-layer/labels";
import type {
  LanguageCode,
  LanguageLevel,
  LanguageSkill,
} from "@/lib/remote-layer/types";
import {
  Button,
  LinkButton,
  Page,
  Panel,
  ProgressBar,
  ToggleCard,
} from "./ui";

const ACCOUNT_TYPES: Array<{
  value: ProfessionalAccountType;
  label: string;
  description: string;
}> = [
  { value: "freelancer", label: "Libero professionista", description: "Operi personalmente con partita IVA." },
  { value: "studio", label: "Studio professionale", description: "Studio associato o multidisciplinare." },
  { value: "agency", label: "Agenzia", description: "Agenzia immobiliare o di servizi." },
  { value: "company", label: "Impresa", description: "Impresa edile, artigiana o operativa." },
  { value: "service_company", label: "Società di servizi", description: "Organizzazione con più operatori." },
];

const VERIFICATIONS: Array<{
  type: VerificationItem["type"];
  label: string;
}> = [
  { type: "identity", label: "Documento di identità" },
  { type: "vat", label: "Partita IVA" },
  { type: "business_registry", label: "Visura camerale" },
  { type: "professional_register", label: "Iscrizione ad albo o ordine" },
  { type: "insurance", label: "Assicurazione professionale" },
  { type: "license", label: "Licenza o abilitazione" },
  { type: "certification", label: "Certificazioni o patentini" },
  { type: "drone_license", label: "Abilitazione operatore drone" },
];

function createVerification(
  type: VerificationItem["type"],
  label: string,
): VerificationItem {
  return {
    id: `verification_${type}`,
    type,
    label,
    status: "pending",
  };
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] =
    useState<ProfessionalAccountType>("freelancer");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [years, setYears] = useState(0);
  const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([
    { language: "it", level: "native", cefr: "native", verified: false },
  ]);
  const [remoteConsultation, setRemoteConsultation] = useState(false);
  const [videoCallAvailable, setVideoCallAvailable] = useState(false);
  const [internationalClientExperience, setInternationalClientExperience] =
    useState(false);
  const [photoReportAvailable, setPhotoReportAvailable] = useState(false);
  const [delegationSupported, setDelegationSupported] = useState(false);
  const [areas, setAreas] = useState("");
  const [online, setOnline] = useState(false);
  const [weeklyLimit, setWeeklyLimit] = useState(10);
  const [verificationItems, setVerificationItems] = useState<
    VerificationItem[]
  >([]);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalSteps = 6;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const toggleVerification = (
    type: VerificationItem["type"],
    label: string,
  ) => {
    setVerificationItems((current) =>
      current.some((item) => item.type === type)
        ? current.filter((item) => item.type !== type)
        : [...current, createVerification(type, label)],
    );
  };

  const toggleLanguage = (language: LanguageCode) => {
    setLanguageSkills((current) =>
      current.some((skill) => skill.language === language)
        ? current.filter((skill) => skill.language !== language)
        : [...current, { language, level: "intermediate", cefr: "B1", verified: false }],
    );
  };

  const changeLanguageLevel = (
    language: LanguageCode,
    level: LanguageLevel,
  ) => {
    setLanguageSkills((current) =>
      current.map((skill) =>
        skill.language === language
          ? {
              ...skill,
              level,
              cefr:
                level === "native"
                  ? "native"
                  : level === "advanced"
                    ? "C1"
                    : level === "intermediate"
                      ? "B1"
                      : "A2",
            }
          : skill,
      ),
    );
  };

  const persist = () => {
    const timestamp = new Date().toISOString();
    const identity: ProfessionalIdentity = {
      id: "professional_current",
      userId: "current-user",
      accountType,
      displayName,
      legalName: legalName || displayName,
      profession,
      bio,
      yearsExperience: years,
      languages: languageSkills.map(
        (skill) => LANGUAGE_LABELS[skill.language],
      ),
      languageSkills,
      remoteCapabilities: {
        languageSkills,
        remoteConsultation,
        videoCallAvailable,
        internationalClientExperience,
        photoReportAvailable,
        delegationSupported,
        asynchronousUpdates: true,
        preferredContactWindows: [],
      },
      generalAreas: areas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      onlineAvailable: online,
      weeklyLeadLimit: weeklyLimit,
      pauseAllLeads: false,
      verificationStatus:
        verificationItems.length > 0 ? "pending" : "not_started",
      verificationItems,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveIdentity(identity);
    setSaved(true);
  };

  if (saved) {
    return (
      <Page>
        <div className="mx-auto max-w-3xl">
          <Panel>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
              ✓
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">
              Profilo base completato
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Lingue e capacità di lavorare a distanza migliorano il matching,
              ma non attivano automaticamente un servizio. Configura ora le
              condizioni operative di ogni servizio.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/professionista/servizi">
                Configura i servizi
              </LinkButton>
              <LinkButton href="/professionista" variant="secondary">
                Vai alla panoramica
              </LinkButton>
            </div>
          </Panel>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/professionista" className="text-sm font-semibold text-blue-600">
            ← Esci
          </Link>
          <span className="text-sm text-slate-500">
            Passaggio {step + 1} di {totalSteps}
          </span>
        </div>

        <Panel>
          <ProgressBar value={progress} label="Configurazione profilo" />

          {step === 0 ? (
            <div className="mt-8">
              <h1 className="text-2xl font-semibold">
                Come è organizzata la tua attività?
              </h1>
              <div className="mt-6 grid gap-3">
                {ACCOUNT_TYPES.map((item) => (
                  <ToggleCard
                    key={item.value}
                    title={item.label}
                    description={item.description}
                    selected={accountType === item.value}
                    onClick={() => setAccountType(item.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-8">
              <h1 className="text-2xl font-semibold">Identità professionale</h1>
              <div className="mt-6 grid gap-5">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nome pubblico"
                  className="min-h-13 rounded-xl border border-slate-200 px-4"
                />
                <input
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                  placeholder="Ragione sociale o nome legale"
                  className="min-h-13 rounded-xl border border-slate-200 px-4"
                />
                <input
                  value={profession}
                  onChange={(event) => setProfession(event.target.value)}
                  placeholder="Professione principale"
                  className="min-h-13 rounded-xl border border-slate-200 px-4"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-8">
              <h1 className="text-2xl font-semibold">
                Esperienza e presentazione
              </h1>
              <div className="mt-6 grid gap-5">
                <input
                  type="number"
                  min={0}
                  value={years}
                  onChange={(event) =>
                    setYears(Number(event.target.value) || 0)
                  }
                  className="min-h-13 rounded-xl border border-slate-200 px-4"
                />
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={5}
                  placeholder="Spiega come lavori e in quali situazioni puoi aiutare."
                  className="rounded-xl border border-slate-200 p-4"
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-8">
              <h1 className="text-2xl font-semibold">
                Lingue e collaborazione a distanza
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Le lingue sono un vantaggio nel matching, non un requisito per
                accedere alla piattaforma. Il livello è dichiarato dal
                professionista; Guimmia può tradurre quando manca una lingua in
                comune.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {SUPPORTED_LANGUAGES.map((language) => {
                  const selected = languageSkills.find(
                    (skill) => skill.language === language,
                  );
                  return (
                    <div
                      key={language}
                      className={`rounded-2xl border p-4 ${
                        selected
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200"
                      }`}
                    >
                      <ToggleCard
                        title={LANGUAGE_LABELS[language]}
                        selected={Boolean(selected)}
                        onClick={() => toggleLanguage(language)}
                      />
                      {selected ? (
                        <>
                        <select
                          value={selected.level}
                          onChange={(event) =>
                            changeLanguageLevel(
                              language,
                              event.target.value as LanguageLevel,
                            )
                          }
                          className="mt-3 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm"
                        >
                          {(Object.keys(LANGUAGE_LEVEL_LABELS) as LanguageLevel[]).map(
                            (level) => (
                              <option key={level} value={level}>
                                {LANGUAGE_LEVEL_LABELS[level]}
                              </option>
                            ),
                          )}
                        </select>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Livello indicativo: {selected.cefr ?? "B1"}. Può essere
                          verificato in una fase successiva.
                        </p>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ToggleCard
                  title="Consulenze a distanza"
                  selected={remoteConsultation}
                  onClick={() => setRemoteConsultation((value) => !value)}
                />
                <ToggleCard
                  title="Videochiamate disponibili"
                  selected={videoCallAvailable}
                  onClick={() => setVideoCallAvailable((value) => !value)}
                />
                <ToggleCard
                  title="Esperienza con clienti che vivono lontano"
                  selected={internationalClientExperience}
                  onClick={() =>
                    setInternationalClientExperience((value) => !value)
                  }
                />
                <ToggleCard
                  title="Report fotografici o video"
                  selected={photoReportAvailable}
                  onClick={() => setPhotoReportAvailable((value) => !value)}
                />
                <ToggleCard
                  title="Gestione tramite delega quando possibile"
                  selected={delegationSupported}
                  onClick={() => setDelegationSupported((value) => !value)}
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-8">
              <h1 className="text-2xl font-semibold">
                Copertura e capacità generale
              </h1>
              <div className="mt-6 grid gap-5">
                <input
                  value={areas}
                  onChange={(event) => setAreas(event.target.value)}
                  placeholder="Catania, Acireale, provincia di Catania"
                  className="min-h-13 rounded-xl border border-slate-200 px-4"
                />
                <ToggleCard
                  title="Disponibile anche online"
                  selected={online}
                  onClick={() => setOnline((value) => !value)}
                />
                <input
                  type="number"
                  min={1}
                  value={weeklyLimit}
                  onChange={(event) =>
                    setWeeklyLimit(Number(event.target.value) || 1)
                  }
                  className="min-h-13 rounded-xl border border-slate-200 px-4"
                />
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="mt-8">
              <h1 className="text-2xl font-semibold">Verifiche e regole</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {VERIFICATIONS.map((item) => (
                  <ToggleCard
                    key={item.type}
                    title={item.label}
                    selected={verificationItems.some(
                      (verification) => verification.type === item.type,
                    )}
                    onClick={() =>
                      toggleVerification(item.type, item.label)
                    }
                  />
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                <p>✓ Il primo contatto resta dentro Guimmia.</p>
                <p>✓ Configurerò soltanto servizi che posso svolgere.</p>
                <p>✓ Indicherò correttamente presenza, delega e report.</p>
                <p>✓ Non presenterò traduzioni automatiche come atti ufficiali.</p>
              </div>
              <div className="mt-4">
                <ToggleCard
                  title="Accetto le regole Guimmia"
                  selected={acceptedRules}
                  onClick={() => setAcceptedRules((value) => !value)}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Indietro
              </Button>
            ) : (
              <span />
            )}
            {step < totalSteps - 1 ? (
              <Button
                disabled={
                  (step === 1 &&
                    (!displayName.trim() || !profession.trim())) ||
                  (step === 2 && bio.trim().length < 20) ||
                  (step === 3 && languageSkills.length === 0) ||
                  (step === 4 && !areas.trim() && !online)
                }
                onClick={() => setStep(step + 1)}
              >
                Continua
              </Button>
            ) : (
              <Button disabled={!acceptedRules} onClick={persist}>
                Completa il profilo
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </Page>
  );
}

