import { NextRequest, NextResponse } from "next/server";

type SuggestionKind = "address" | "street" | "city" | "postcode" | "place";

type LocationSuggestion = {
  id: string;
  primary: string;
  secondary: string;
  kind: SuggestionKind;
  country: string;
  city: string;
  province: string;
  postalCode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  provider: "arcgis" | "photon" | "open-meteo" | "zippopotam";
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number | string;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_value?: string;
    type?: string;
  };
};

type PhotonResponse = { features?: PhotonFeature[] };

type ArcGisCandidate = {
  address?: string;
  location?: { x?: number; y?: number };
  attributes?: Record<string, string | number | null | undefined>;
};

type ArcGisResponse = {
  candidates?: ArcGisCandidate[];
  error?: { message?: string };
};

type OpenMeteoResult = {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  postcodes?: string[];
};

type OpenMeteoResponse = { results?: OpenMeteoResult[] };

type ZippopotamPlace = {
  "place name"?: string;
  state?: string;
  "state abbreviation"?: string;
  latitude?: string;
  longitude?: string;
};

type ZippopotamResponse = {
  "post code"?: string;
  country?: string;
  places?: ZippopotamPlace[];
};

const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";
const ARCGIS_ENDPOINT =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
const OPEN_METEO_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const ZIP_ENDPOINT = "https://api.zippopotam.us/IT";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unique(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function normalizeForKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupe(suggestions: LocationSuggestion[]) {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = [
      normalizeForKey(suggestion.primary),
      normalizeForKey(suggestion.city),
      normalizeForKey(suggestion.province),
      suggestion.postalCode,
      suggestion.latitude?.toFixed(4) ?? "",
      suggestion.longitude?.toFixed(4) ?? "",
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isItalianPhoton(feature: PhotonFeature) {
  const code = clean(feature.properties?.countrycode).toUpperCase();
  const country = clean(feature.properties?.country).toLowerCase();
  return !code || code === "IT" || country === "italia" || country === "italy";
}

function photonKind(feature: PhotonFeature): SuggestionKind {
  const value = clean(feature.properties?.osm_value || feature.properties?.type).toLowerCase();
  if (value === "house") return "address";
  if (["street", "residential", "pedestrian", "service", "road"].includes(value)) return "street";
  if (["city", "town", "village", "municipality", "hamlet", "locality"].includes(value)) return "city";
  return "place";
}

function photonToSuggestion(feature: PhotonFeature, index: number): LocationSuggestion {
  const p = feature.properties ?? {};
  const kind = photonKind(feature);
  const city = clean(p.city) || clean(p.district) || clean(p.county);
  const province = clean(p.county) || clean(p.state);
  const postalCode = clean(p.postcode);
  const street = clean(p.street);
  const houseNumber = clean(p.housenumber);
  const name = clean(p.name);
  const address = street
    ? [street, houseNumber].filter(Boolean).join(" ")
    : kind === "street" || kind === "address"
      ? name
      : "";
  const primary = address || name || city || "Località";
  const coordinates = feature.geometry?.coordinates;

  return {
    id: `photon-${String(p.osm_type ?? "x")}-${String(p.osm_id ?? index)}-${index}`,
    primary,
    secondary: unique([postalCode, city, province, clean(p.state), "Italia"]).join(" · "),
    kind,
    country: "Italia",
    city,
    province,
    postalCode,
    address,
    latitude: asNumber(coordinates?.[1]),
    longitude: asNumber(coordinates?.[0]),
    provider: "photon",
  };
}

async function searchPhoton(query: string, limit = 10) {
  const params = new URLSearchParams({ q: query, lang: "it", limit: String(limit) });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "it-IT,it;q=0.9",
        "User-Agent": "CasaPilot/1.0",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Photon ${response.status}`);
    const payload = (await response.json()) as PhotonResponse;
    return (payload.features ?? []).filter(isItalianPhoton).map(photonToSuggestion);
  } finally {
    clearTimeout(timeout);
  }
}

function arcGisKind(attributes: Record<string, string | number | null | undefined>): SuggestionKind {
  const type = clean(attributes.Addr_type).toLowerCase();
  if (["pointaddress", "subaddress", "streetaddress"].includes(type)) return "address";
  if (["streetname", "streetint"].includes(type)) return "street";
  if (["locality", "city", "subregion", "region", "neighborhood"].includes(type)) return "city";
  if (type === "postal") return "postcode";
  return "place";
}

function arcGisToSuggestion(candidate: ArcGisCandidate, index: number): LocationSuggestion {
  const a = candidate.attributes ?? {};
  const kind = arcGisKind(a);
  const city = clean(a.City) || clean(a.District) || clean(a.Subregion);
  const province = clean(a.RegionAbbr) || clean(a.Region) || clean(a.Subregion);
  const postalCode = clean(a.Postal);
  const address = clean(a.StAddr) || clean(a.Address) || clean(a.Addr);
  const longLabel = clean(a.LongLabel) || clean(a.Match_addr) || clean(candidate.address);
  const primary =
    clean(a.ShortLabel) ||
    address ||
    (kind === "city" ? city : "") ||
    longLabel.split(",")[0] ||
    "Località";

  return {
    id: `arcgis-${index}-${normalizeForKey(longLabel).slice(0, 60)}`,
    primary,
    secondary: unique([postalCode, city, province, "Italia"]).join(" · "),
    kind,
    country: "Italia",
    city: city || (kind === "city" ? primary : ""),
    province,
    postalCode,
    address: kind === "city" ? "" : address || (kind === "street" || kind === "address" ? primary : ""),
    latitude: asNumber(candidate.location?.y ?? a.DisplayY),
    longitude: asNumber(candidate.location?.x ?? a.DisplayX),
    provider: "arcgis",
  };
}

async function searchArcGis(query: string, maxLocations = 10) {
  const params = new URLSearchParams({
    SingleLine: query,
    countryCode: "ITA",
    maxLocations: String(maxLocations),
    outFields: "*",
    outSR: "4326",
    forStorage: "false",
    langCode: "ITA",
    f: "json",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(`${ARCGIS_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json", "Accept-Language": "it-IT,it;q=0.9" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`ArcGIS ${response.status}`);
    const payload = (await response.json()) as ArcGisResponse;
    if (payload.error) throw new Error(payload.error.message || "ArcGIS error");
    return (payload.candidates ?? [])
      .filter((candidate) => {
        const country = clean(candidate.attributes?.Country).toUpperCase();
        return !country || country === "ITA" || country === "ITALY" || country === "ITALIA";
      })
      .map(arcGisToSuggestion);
  } finally {
    clearTimeout(timeout);
  }
}

function openMeteoToSuggestion(result: OpenMeteoResult, index: number): LocationSuggestion {
  const city = clean(result.name);
  const province = clean(result.admin2) || clean(result.admin1);
  const region = clean(result.admin1);
  const postalCode = result.postcodes?.[0] ?? "";
  return {
    id: `open-meteo-${result.id ?? index}`,
    primary: city || "Comune",
    secondary: unique([postalCode, province, region, "Italia"]).join(" · "),
    kind: "city",
    country: "Italia",
    city,
    province,
    postalCode,
    address: "",
    latitude: asNumber(result.latitude),
    longitude: asNumber(result.longitude),
    provider: "open-meteo",
  };
}

async function searchOpenMeteo(query: string) {
  const params = new URLSearchParams({
    name: query,
    count: "10",
    language: "it",
    format: "json",
    countryCode: "IT",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(`${OPEN_METEO_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const payload = (await response.json()) as OpenMeteoResponse;
    return (payload.results ?? [])
      .filter((result) => clean(result.country_code).toUpperCase() === "IT")
      .map(openMeteoToSuggestion);
  } finally {
    clearTimeout(timeout);
  }
}

async function searchPostcode(postcode: string): Promise<LocationSuggestion[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${ZIP_ENDPOINT}/${encodeURIComponent(postcode)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Postal lookup ${response.status}`);
    const payload = (await response.json()) as ZippopotamResponse;
    return (payload.places ?? []).map((place, index) => {
      const city = clean(place["place name"]);
      const province = clean(place["state abbreviation"]) || clean(place.state);
      return {
        id: `zip-${postcode}-${city}-${index}`,
        primary: city || postcode,
        secondary: unique([postcode, province, "Italia"]).join(" · "),
        kind: "postcode",
        country: "Italia",
        city,
        province,
        postalCode: postcode,
        address: "",
        latitude: asNumber(place.latitude),
        longitude: asNumber(place.longitude),
        provider: "zippopotam",
      };
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchMunicipalities(query: string) {
  const [openMeteoResult, photonResult, arcGisResult] = await Promise.allSettled([
    searchOpenMeteo(query),
    searchPhoton(query, 10),
    searchArcGis(query, 10),
  ]);

  const openMeteo = openMeteoResult.status === "fulfilled" ? openMeteoResult.value : [];
  const photon = photonResult.status === "fulfilled"
    ? photonResult.value.filter((item) => item.kind === "city" || (!item.address && Boolean(item.city)))
    : [];
  const arcGis = arcGisResult.status === "fulfilled"
    ? arcGisResult.value.filter((item) => item.kind === "city" || (!item.address && Boolean(item.city)))
    : [];

  return dedupe([...openMeteo, ...photon, ...arcGis]).slice(0, 10);
}

async function searchAddresses(
  query: string,
  city: string,
  province: string,
  postcode: string,
) {
  const fullQuery = unique([query, postcode, city, province, "Italia"]).join(", ");
  const [photonResult, arcGisResult] = await Promise.allSettled([
    searchPhoton(fullQuery, 12),
    searchArcGis(fullQuery, 12),
  ]);

  const photon = photonResult.status === "fulfilled" ? photonResult.value : [];
  const arcGis = arcGisResult.status === "fulfilled" ? arcGisResult.value : [];
  const preferred = [...photon, ...arcGis].filter(
    (item) => item.kind === "address" || item.kind === "street" || Boolean(item.address),
  );
  const fallback = preferred.length > 0 ? preferred : [...photon, ...arcGis];
  return dedupe(fallback).slice(0, 10);
}

async function geocode(query: string) {
  const [photonResult, arcGisResult, openMeteoResult] = await Promise.allSettled([
    searchPhoton(query, 10),
    searchArcGis(query, 10),
    searchOpenMeteo(query),
  ]);
  return dedupe([
    ...(photonResult.status === "fulfilled" ? photonResult.value : []),
    ...(arcGisResult.status === "fulfilled" ? arcGisResult.value : []),
    ...(openMeteoResult.status === "fulfilled" ? openMeteoResult.value : []),
  ]).slice(0, 10);
}

export async function GET(request: NextRequest) {
  const query = clean(request.nextUrl.searchParams.get("q") ?? "").replace(/\s+/g, " ");
  const mode = clean(request.nextUrl.searchParams.get("mode") ?? "");
  const city = clean(request.nextUrl.searchParams.get("city") ?? "");
  const province = clean(request.nextUrl.searchParams.get("province") ?? "");
  const postcode = clean(request.nextUrl.searchParams.get("postcode") ?? "");

  if (query.length < 2 || query.length > 160) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    let suggestions: LocationSuggestion[] = [];
    let provider = "multi-provider";

    if (mode === "postcode" || /^\d{5}$/.test(query)) {
      suggestions = await searchPostcode(query);
      provider = "postcode";
    } else if (mode === "municipality") {
      suggestions = await searchMunicipalities(query);
      provider = "municipality";
    } else if (mode === "address") {
      suggestions = await searchAddresses(query, city, province, postcode);
      provider = "address";
    } else {
      suggestions = await geocode(query);
      provider = "geocode";
    }

    return NextResponse.json(
      { suggestions, provider },
      { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } },
    );
  } catch (error) {
    console.error("CasaPilot location search failed", error);
    return NextResponse.json(
      { suggestions: [], message: "location-search-unavailable" },
      { status: 502 },
    );
  }
}
