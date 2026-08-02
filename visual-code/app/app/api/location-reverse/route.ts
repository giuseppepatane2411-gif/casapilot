import { NextRequest, NextResponse } from "next/server";

type PhotonReverseResponse = {
  features?: Array<{
    properties?: {
      name?: string;
      street?: string;
      housenumber?: string;
      postcode?: string;
      city?: string;
      district?: string;
      county?: string;
      state?: string;
      country?: string;
    };
  }>;
};

type ArcGisReverseResponse = {
  address?: Record<string, string | number | null | undefined>;
  location?: { x?: number; y?: number };
  error?: { message?: string };
};

type ReverseResult = {
  label: string;
  country: string;
  city: string;
  province: string;
  postalCode: string;
  address: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]) {
  return values.filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);
}

async function reversePhoton(latitude: number, longitude: number): Promise<ReverseResult | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    lang: "it",
    limit: "1",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`https://photon.komoot.io/reverse?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "it-IT,it;q=0.9",
        "User-Agent": "CasaPilot/1.0",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as PhotonReverseResponse;
    const p = payload.features?.[0]?.properties;
    if (!p) return null;
    const city = clean(p.city) || clean(p.district) || clean(p.county);
    const province = clean(p.county) || clean(p.state);
    const address = [clean(p.street) || clean(p.name), clean(p.housenumber)]
      .filter(Boolean)
      .join(" ");
    const postalCode = clean(p.postcode);
    return {
      label: unique([address, postalCode, city, province]).join(", "),
      country: "Italia",
      city,
      province,
      postalCode,
      address,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function reverseArcGis(latitude: number, longitude: number): Promise<ReverseResult | null> {
  const params = new URLSearchParams({
    location: `${longitude},${latitude}`,
    distance: "200",
    outSR: "4326",
    langCode: "ITA",
    f: "json",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?${params.toString()}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json", "Accept-Language": "it-IT,it;q=0.9" },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as ArcGisReverseResponse;
    if (payload.error || !payload.address) return null;
    const a = payload.address;
    const city = clean(a.City) || clean(a.District) || clean(a.Subregion);
    const province = clean(a.RegionAbbr) || clean(a.Region) || clean(a.Subregion);
    const postalCode = clean(a.Postal);
    const address = clean(a.Address) || clean(a.ShortLabel) || clean(a.Match_addr).split(",")[0];
    const label = clean(a.LongLabel) || clean(a.Match_addr) || unique([address, postalCode, city, province]).join(", ");
    return { label, country: "Italia", city, province, postalCode, address };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ result: null }, { status: 400 });
  }

  const [arcGisResult, photonResult] = await Promise.allSettled([
    reverseArcGis(latitude, longitude),
    reversePhoton(latitude, longitude),
  ]);
  const result =
    (arcGisResult.status === "fulfilled" ? arcGisResult.value : null) ||
    (photonResult.status === "fulfilled" ? photonResult.value : null);

  return NextResponse.json(
    { result },
    { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } },
  );
}
