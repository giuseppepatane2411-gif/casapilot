const ITALIAN_REGIONS = new Set(
  [
    "abruzzo",
    "basilicata",
    "calabria",
    "campania",
    "emilia romagna",
    "friuli venezia giulia",
    "lazio",
    "liguria",
    "lombardia",
    "marche",
    "molise",
    "piemonte",
    "puglia",
    "sardegna",
    "sicilia",
    "toscana",
    "trentino alto adige",
    "trentino sudtirol",
    "umbria",
    "valle d aosta",
    "veneto",
  ].map(normalizeGeographyKey),
);

const REGION_ABBREVIATIONS = new Set([
  "ABR",
  "BAS",
  "CAL",
  "CAM",
  "EMR",
  "FVG",
  "LAZ",
  "LIG",
  "LOM",
  "MAR",
  "MOL",
  "PMN",
  "PUG",
  "SAR",
  "SIC",
  "TOS",
  "TAA",
  "UMB",
  "VDA",
  "VEN",
]);

export function normalizeGeographyKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanProvinceLabel(value: unknown) {
  if (typeof value !== "string") return "";
  const cleaned = value
    .trim()
    .replace(/^citt[aà]\s+metropolitana\s+di\s+/i, "")
    .replace(/^provincia\s+(?:autonoma\s+)?di\s+/i, "")
    .replace(/^metropolitan\s+city\s+of\s+/i, "")
    .trim();
  if (!cleaned || cleaned.length > 100) return "";

  const key = normalizeGeographyKey(cleaned);
  const uppercase = cleaned.toUpperCase();
  if (ITALIAN_REGIONS.has(key) || REGION_ABBREVIATIONS.has(uppercase)) {
    return "";
  }

  if (/^[A-Z]{2}$/i.test(cleaned)) return uppercase;
  return cleaned;
}

export function resolveItalianProvince(...candidates: unknown[]) {
  for (const candidate of candidates) {
    const province = cleanProvinceLabel(candidate);
    if (province) return province;
  }
  return "";
}
