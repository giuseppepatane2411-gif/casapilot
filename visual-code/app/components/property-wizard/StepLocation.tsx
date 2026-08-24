import { Hash, MapPin, ShieldCheck } from "lucide-react";

import GuidedAddressSearch, {
  type GuidedAddressValue,
} from "@/components/property-wizard/GuidedAddressSearch";
import PropertyLocationMap from "@/components/property-wizard/PropertyLocationMap";
import type { WizardData } from "@/lib/property-journey/types";

type StepLocationProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
};

export default function StepLocation({ data, onChange }: StepLocationProps) {
  const addressValue: GuidedAddressValue = {
    country: data.country,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
  };

  function applyAddress(selection: GuidedAddressValue) {
    onChange("country", selection.country || "Italia");
    onChange("city", selection.city);
    onChange("province", selection.province);
    onChange("postalCode", selection.postalCode);
    onChange("address", selection.address);
    onChange("latitude", selection.latitude);
    onChange("longitude", selection.longitude);
    onChange("locationVerified", false);
    onChange("locationVerifiedAt", "");
    onChange("locationLabel", "");
  }

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <MapPin size={19} />
          </span>
          <div>
            <p className="font-bold text-slate-950">Indirizzo e posizione sono due cose diverse</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Prima troviamo Comune e via. Subito dopo controllerai il punto sulla mappa: così Guimmia non salva un immobile nel posto sbagliato anche quando il civico non viene riconosciuto perfettamente.
            </p>
          </div>
        </div>
      </div>

      <GuidedAddressSearch value={addressValue} onChange={applyAddress} />

      <PropertyLocationMap
        latitude={data.latitude}
        longitude={data.longitude}
        verified={data.locationVerified}
        locationLabel={data.locationLabel}
        searchQuery={[
          data.address,
          data.postalCode,
          data.city,
          data.province,
          data.country || "Italia",
        ]
          .filter(Boolean)
          .join(", ")}
        onChange={({ latitude, longitude, verified, locationLabel }) => {
          onChange("latitude", latitude);
          onChange("longitude", longitude);
          onChange("locationVerified", verified);
          onChange("locationVerifiedAt", verified ? new Date().toISOString() : "");
          onChange("locationLabel", locationLabel);
        }}
      />

      <section className={`rounded-[24px] border p-4 ${data.locationVerified ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"}`}>
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${data.locationVerified ? "text-emerald-600" : "text-amber-600"}`}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="font-bold text-slate-950">
              {data.locationVerified ? "Posizione verificata" : "Controlla il punto prima di continuare"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {data.locationVerified
                ? "Guimmia ha salvato il punto scelto. Se modifichi indirizzo o mappa, ti chiederemo di confermarlo di nuovo."
                : "Puoi continuare anche senza confermare, ma per creare annunci precisi sarà importante verificare la posizione."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
            <Hash size={18} />
          </span>
          <div>
            <p className="font-bold text-slate-950">Dati catastali</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Se li conosci, aggiungili adesso. Puoi completarli anche più avanti dalla pagina dell’immobile.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Foglio" value={data.cadastralSheet} placeholder="Es. 12" onChange={(value) => onChange("cadastralSheet", value)} />
          <Field label="Particella / mappale" value={data.cadastralParcel} placeholder="Es. 345" onChange={(value) => onChange("cadastralParcel", value)} />
          <Field label="Subalterno" value={data.cadastralSubaltern} placeholder="Es. 7" onChange={(value) => onChange("cadastralSubaltern", value)} />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Il subalterno può non essere presente per alcune tipologie di immobile. Questi dati non bloccano la creazione della pratica.
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-900">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
