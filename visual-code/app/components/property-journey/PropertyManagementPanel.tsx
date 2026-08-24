"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";

import GuidedAddressSearch, {
  type GuidedAddressValue,
} from "@/components/property-wizard/GuidedAddressSearch";
import PropertyLocationMap from "@/components/property-wizard/PropertyLocationMap";
import { OCCUPANCY_OPTIONS } from "@/lib/property-journey/constants";
import { deleteJourneyCompletely } from "@/lib/property-journey/delete";
import { updateJourneyProperty } from "@/lib/property-journey/storage";
import type {
  OccupancyStatus,
  PropertyJourney,
} from "@/lib/property-journey/types";

type EditableProperty = PropertyJourney["property"];

type PropertyManagementPanelProps = {
  journey: PropertyJourney;
};

export default function PropertyManagementPanel({ journey }: PropertyManagementPanelProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<EditableProperty>({
    ...journey.property,
    cadastralSheet: journey.property.cadastralSheet ?? "",
    cadastralParcel: journey.property.cadastralParcel ?? "",
    cadastralSubaltern: journey.property.cadastralSubaltern ?? "",
    latitude: journey.property.latitude ?? null,
    longitude: journey.property.longitude ?? null,
    locationVerified: journey.property.locationVerified ?? false,
    locationVerifiedAt: journey.property.locationVerifiedAt ?? "",
    locationLabel: journey.property.locationLabel ?? "",
  });

  function update<K extends keyof EditableProperty>(field: K, value: EditableProperty[K]) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyAddress(selection: GuidedAddressValue) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      country: selection.country || "Italia",
      city: selection.city,
      province: selection.province,
      postalCode: selection.postalCode,
      address: selection.address,
      latitude: selection.latitude,
      longitude: selection.longitude,
      locationVerified: false,
      locationVerifiedAt: "",
      locationLabel: "",
    }));
  }

  function cancelEditing() {
    setForm({
      ...journey.property,
      cadastralSheet: journey.property.cadastralSheet ?? "",
      cadastralParcel: journey.property.cadastralParcel ?? "",
      cadastralSubaltern: journey.property.cadastralSubaltern ?? "",
      latitude: journey.property.latitude ?? null,
      longitude: journey.property.longitude ?? null,
      locationVerified: journey.property.locationVerified ?? false,
      locationVerifiedAt: journey.property.locationVerifiedAt ?? "",
      locationLabel: journey.property.locationLabel ?? "",
    });
    setEditing(false);
    setSaved(false);
  }

  function save() {
    updateJourneyProperty(journey.id, {
      ...form,
      name: form.name.trim() || journey.property.name,
      surface: form.surface && form.surface > 0 ? form.surface : null,
      country: form.country.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      address: form.address.trim(),
      postalCode: form.postalCode.trim(),
      cadastralSheet: (form.cadastralSheet ?? "").trim(),
      cadastralParcel: (form.cadastralParcel ?? "").trim(),
      cadastralSubaltern: (form.cadastralSubaltern ?? "").trim(),
    });
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  async function removeJourney() {
    setDeleting(true);
    await deleteJourneyCompletely(journey.id);
    router.replace("/dashboard/properties");
  }

  return (
    <section id="manage-property" className="scroll-mt-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-blue-600">Gestisci l’immobile</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Correggi un dato o riparti da zero</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Puoi correggere i dati senza ricominciare. Se invece vuoi rimuovere completamente la pratica, puoi eliminare l’immobile.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} />
            Modifica dati
          </button>
        )}
      </div>

      {saved && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <Check size={16} />
          Modifiche salvate.
        </div>
      )}

      {editing && (
        <div className="mt-6 space-y-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nome dell’immobile"
              value={form.name}
              onChange={(value) => update("name", value)}
            />
            <label>
              <span className="text-sm font-bold text-slate-900">Superficie</span>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="1"
                  value={form.surface ?? ""}
                  onChange={(event) => update("surface", event.target.value ? Number(event.target.value) : null)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">m²</span>
              </div>
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-bold text-slate-900">Situazione attuale</span>
              <select
                value={form.occupancy ?? ""}
                onChange={(event) => update("occupancy", (event.target.value || null) as OccupancyStatus | null)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Non indicata</option>
                {OCCUPANCY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <p className="mb-3 text-sm font-bold text-slate-900">Indirizzo e posizione</p>
            <GuidedAddressSearch
              value={{
                country: form.country,
                city: form.city,
                province: form.province,
                postalCode: form.postalCode,
                address: form.address,
                latitude: form.latitude,
                longitude: form.longitude,
              }}
              onChange={applyAddress}
            />

            <div className="mt-5">
              <PropertyLocationMap
                latitude={form.latitude ?? null}
                longitude={form.longitude ?? null}
                verified={form.locationVerified}
                locationLabel={form.locationLabel}
                searchQuery={[
                  form.address,
                  form.postalCode,
                  form.city,
                  form.province,
                  form.country || "Italia",
                ]
                  .filter(Boolean)
                  .join(", ")}
                onChange={({ latitude, longitude, verified, locationLabel }) => {
                  setSaved(false);
                  setForm((current) => ({
                    ...current,
                    latitude,
                    longitude,
                    locationVerified: verified,
                    locationVerifiedAt: verified ? new Date().toISOString() : "",
                    locationLabel,
                  }));
                }}
                compact
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <p className="text-sm font-bold text-slate-900">Dati catastali</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Puoi completarli o correggerli in qualsiasi momento.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Foglio" value={form.cadastralSheet ?? ""} onChange={(value) => update("cadastralSheet", value)} />
              <Field label="Particella / mappale" value={form.cadastralParcel ?? ""} onChange={(value) => update("cadastralParcel", value)} />
              <Field label="Subalterno" value={form.cadastralSubaltern ?? ""} onChange={(value) => update("cadastralSubaltern", value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEditing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              <X size={16} />
              Annulla
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Save size={16} />
              Salva modifiche
            </button>
          </div>
        </div>
      )}

      <div className="mt-7 border-t border-slate-100 pt-6">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={16} />
            Elimina questo immobile
          </button>
        ) : (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600">
                <AlertTriangle size={19} />
              </span>
              <div>
                <p className="font-bold text-rose-950">Vuoi davvero ripartire da zero?</p>
                <p className="mt-1 text-sm leading-6 text-rose-800">
                  Verranno eliminati da questo browser l’immobile, il suo percorso, la memoria di Guimmia e i file collegati nell’Archivio locale. Questa operazione non si può annullare.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-rose-100"
              >
                No, mantienila
              </button>
              <button
                type="button"
                onClick={() => void removeJourney()}
                disabled={deleting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleting ? "Eliminazione…" : "Sì, elimina definitivamente"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-900">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

