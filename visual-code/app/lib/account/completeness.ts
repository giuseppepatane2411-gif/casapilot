import type { ProfessionalProfile } from "@/lib/account/types";

export type ProfessionalMissingField = {
  id: string;
  label: string;
};

export function getProfessionalMissingFields(
  profile: ProfessionalProfile,
): ProfessionalMissingField[] {
  const missing: ProfessionalMissingField[] = [];

  if (!profile.profession.trim()) missing.push({ id: "profession", label: "Professione" });
  if (!profile.businessName.trim()) missing.push({ id: "businessName", label: "Studio o attività" });
  if (!profile.phone.trim()) missing.push({ id: "phone", label: "Telefono" });
  if (!profile.city.trim()) missing.push({ id: "city", label: "Comune" });
  if (!profile.province.trim()) missing.push({ id: "province", label: "Provincia" });
  if (profile.bio.trim().length < 80) {
    missing.push({ id: "bio", label: "Presentazione di almeno 80 caratteri" });
  }
  if (profile.serviceAreas.length === 0) {
    missing.push({ id: "serviceAreas", label: "Almeno una zona servita" });
  }

  return missing;
}

export function getProfessionalCompleteness(profile: ProfessionalProfile) {
  const total = 7;
  const missing = getProfessionalMissingFields(profile);
  return Math.round(((total - missing.length) / total) * 100);
}
