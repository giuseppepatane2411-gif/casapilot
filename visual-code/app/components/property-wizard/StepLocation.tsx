import { MapPin } from "lucide-react";

import type { WizardData } from "@/lib/property-journey/types";

type StepLocationProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
};

export default function StepLocation({
  data,
  onChange,
}: StepLocationProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <MapPin size={19} />
          </span>
          <div>
            <p className="font-bold text-slate-950">Inserisci i dati principali</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Non serve indicare interno o altri dati sensibili. Potrai completarli più avanti.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Paese"
          value={data.country}
          placeholder="Italia"
          onChange={(value) => onChange("country", value)}
        />
        <Field
          label="Comune o città"
          value={data.city}
          placeholder="Catania"
          onChange={(value) => onChange("city", value)}
        />
        <Field
          label="Provincia"
          value={data.province}
          placeholder="CT"
          onChange={(value) => onChange("province", value)}
        />
        <Field
          label="CAP"
          value={data.postalCode}
          placeholder="95100"
          inputMode="numeric"
          onChange={(value) => onChange("postalCode", value)}
        />
        <div className="sm:col-span-2">
          <Field
            label="Indirizzo"
            value={data.address}
            placeholder="Via Etnea 100"
            onChange={(value) => onChange("address", value)}
          />
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  inputMode?: "text" | "numeric";
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  placeholder,
  inputMode = "text",
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-900">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
