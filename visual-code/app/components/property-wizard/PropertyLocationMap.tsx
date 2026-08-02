"use client";

import {
  Check,
  CheckCircle2,
  Crosshair,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PropertyLocationUpdate = Coordinates & {
  verified: boolean;
  locationLabel: string;
};

type LocationSearchResponse = {
  suggestions?: Array<{
    latitude?: number | null;
    longitude?: number | null;
  }>;
};

type ReverseResponse = {
  result?: {
    label?: string;
  } | null;
};

type PropertyLocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  searchQuery: string;
  verified?: boolean;
  locationLabel?: string;
  onChange: (location: PropertyLocationUpdate) => void;
  compact?: boolean;
  readOnly?: boolean;
};

type Point = { x: number; y: number };

type DragState = {
  pointerId: number;
  start: Point;
  projectedCenter: Point;
  moved: boolean;
};

const TILE_SIZE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 19;
const MAX_LATITUDE = 85.05112878;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function project(latitude: number, longitude: number, zoom: number): Point {
  const safeLatitude = clamp(latitude, -MAX_LATITUDE, MAX_LATITUDE);
  const sin = Math.sin((safeLatitude * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((normalizeLongitude(longitude) + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function unproject(x: number, y: number, zoom: number): Coordinates {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = normalizeLongitude((x / scale) * 360 - 180);
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = clamp(
    (180 / Math.PI) * Math.atan(Math.sinh(n)),
    -MAX_LATITUDE,
    MAX_LATITUDE,
  );
  return { latitude, longitude };
}

function isValidCoordinate(value: number | null) {
  return value !== null && Number.isFinite(value);
}

export default function PropertyLocationMap({
  latitude,
  longitude,
  searchQuery,
  verified = false,
  locationLabel = "",
  onChange,
  compact = false,
  readOnly = false,
}: PropertyLocationMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [size, setSize] = useState({ width: 640, height: compact ? 240 : 360 });
  const [zoom, setZoom] = useState(compact ? 16 : 17);
  const [viewCenter, setViewCenter] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [dragging, setDragging] = useState(false);

  const hasPosition = isValidCoordinate(latitude) && isValidCoordinate(longitude);

  useEffect(() => {
    if (!hasPosition || latitude === null || longitude === null) return;
    const timer = window.setTimeout(() => setViewCenter({ latitude, longitude }), 0);
    return () => window.clearTimeout(timer);
  }, [hasPosition, latitude, longitude]);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasPosition]);

  const tiles = useMemo(() => {
    if (!viewCenter) return [];
    const center = project(viewCenter.latitude, viewCenter.longitude, zoom);
    const topLeft = { x: center.x - size.width / 2, y: center.y - size.height / 2 };
    const firstX = Math.floor(topLeft.x / TILE_SIZE) - 1;
    const lastX = Math.floor((topLeft.x + size.width) / TILE_SIZE) + 1;
    const firstY = Math.floor(topLeft.y / TILE_SIZE) - 1;
    const lastY = Math.floor((topLeft.y + size.height) / TILE_SIZE) + 1;
    const count = 2 ** zoom;
    const nextTiles: Array<{ key: string; src: string; left: number; top: number }> = [];

    for (let tileY = firstY; tileY <= lastY; tileY += 1) {
      if (tileY < 0 || tileY >= count) continue;
      for (let tileX = firstX; tileX <= lastX; tileX += 1) {
        const wrappedX = ((tileX % count) + count) % count;
        nextTiles.push({
          key: `${zoom}-${tileX}-${tileY}`,
          src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
          left: tileX * TILE_SIZE - topLeft.x,
          top: tileY * TILE_SIZE - topLeft.y,
        });
      }
    }
    return nextTiles;
  }, [size.height, size.width, viewCenter, zoom]);

  function commitPosition(coordinates: Coordinates, nextLabel = locationLabel) {
    setViewCenter(coordinates);
    setLocationError("");
    onChange({ ...coordinates, verified: false, locationLabel: nextLabel });
  }

  async function locateFromAddress() {
    const normalized = searchQuery.trim().replace(/\s+/g, " ");
    if (normalized.length < 2) {
      setLocationError("Inserisci prima almeno il Comune e la via.");
      return;
    }
    setLocating(true);
    setLocationError("");
    try {
      const params = new URLSearchParams({ q: normalized, mode: "geocode" });
      const response = await fetch(`/api/location-search?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("location-search-failed");
      const payload = (await response.json()) as LocationSearchResponse;
      const match = (payload.suggestions ?? []).find(
        (suggestion) =>
          typeof suggestion.latitude === "number" &&
          typeof suggestion.longitude === "number",
      );
      if (!match || match.latitude == null || match.longitude == null) {
        setLocationError("Non ho trovato un punto preciso. Completa meglio via, civico e Comune oppure usa la tua posizione.");
        return;
      }
      commitPosition({ latitude: match.latitude, longitude: match.longitude }, normalized);
    } catch {
      setLocationError("La ricerca della posizione non risponde. Puoi comunque indicare il punto manualmente.");
    } finally {
      setLocating(false);
    }
  }

  function locateCurrentPosition() {
    if (!("geolocation" in navigator)) {
      setLocationError("Questo dispositivo non permette di leggere la posizione.");
      return;
    }
    setGeolocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        commitPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setZoom(18);
        setGeolocating(false);
      },
      () => {
        setLocationError("Non ho potuto usare la tua posizione. Controlla il permesso del browser oppure sposta la mappa a mano.");
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function confirmPosition() {
    if (!viewCenter) return;
    setConfirming(true);
    setLocationError("");
    let label = locationLabel || searchQuery;
    try {
      const params = new URLSearchParams({
        lat: String(viewCenter.latitude),
        lon: String(viewCenter.longitude),
      });
      const response = await fetch(`/api/location-reverse?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as ReverseResponse;
        label = payload.result?.label || label;
      }
    } catch {
      // The coordinates can still be confirmed even when the descriptive label is unavailable.
    } finally {
      onChange({ ...viewCenter, verified: true, locationLabel: label });
      setConfirming(false);
    }
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly || !viewCenter) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-control]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      projectedCenter: project(viewCenter.latitude, viewCenter.longitude, zoom),
      moved: false,
    };
    setDragging(true);
  }

  function pan(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || readOnly) return;
    const dx = event.clientX - drag.start.x;
    const dy = event.clientY - drag.start.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
    setViewCenter(unproject(drag.projectedCenter.x - dx, drag.projectedCenter.y - dy, zoom));
  }

  function finishPan(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || readOnly || !viewCenter) return;
    const dx = event.clientX - drag.start.x;
    const dy = event.clientY - drag.start.y;
    let coordinates = viewCenter;

    if (!drag.moved && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const center = project(viewCenter.latitude, viewCenter.longitude, zoom);
      coordinates = unproject(
        center.x + event.clientX - rect.left - rect.width / 2,
        center.y + event.clientY - rect.top - rect.height / 2,
        zoom,
      );
    } else if (drag.moved) {
      coordinates = unproject(drag.projectedCenter.x - dx, drag.projectedCenter.y - dy, zoom);
    }

    dragRef.current = null;
    setDragging(false);
    commitPosition(coordinates);
  }

  function cancelPan() {
    dragRef.current = null;
    setDragging(false);
  }

  if (!hasPosition || !viewCenter) {
    return (
      <section className="rounded-[26px] border border-dashed border-blue-200 bg-blue-50/60 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <MapPin size={20} />
          </span>
          <div>
            <p className="font-bold text-slate-950">Ora posizioniamo l’immobile sulla mappa</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Possiamo partire dall’indirizzo oppure dalla posizione del dispositivo. Dopo potrai spostare la mappa con il dito fino al punto esatto.
            </p>
          </div>
        </div>
        {!readOnly && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={locateFromAddress}
              disabled={locating}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {locating ? <LoaderCircle size={17} className="animate-spin" /> : <LocateFixed size={17} />}
              Trova dall’indirizzo
            </button>
            <button
              type="button"
              onClick={locateCurrentPosition}
              disabled={geolocating}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
            >
              {geolocating ? <LoaderCircle size={17} className="animate-spin" /> : <Navigation size={17} />}
              Usa la mia posizione
            </button>
          </div>
        )}
        {locationError && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-amber-700">{locationError}</p>}
      </section>
    );
  }

  return (
    <section className={`overflow-hidden rounded-[26px] border bg-white shadow-sm ${verified ? "border-emerald-200" : "border-amber-200"}`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-bold text-slate-950">
            <Crosshair size={17} className="text-blue-600" />
            Posizione esatta
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {readOnly
              ? "Questo è il punto salvato per l’immobile."
              : "Trascina la mappa sotto il segnaposto. Su smartphone è più semplice che trascinare un piccolo cursore."}
          </p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {verified ? <CheckCircle2 size={14} /> : <MapPin size={14} />}
          {verified ? "Posizione confermata" : "Da confermare"}
        </span>
      </div>

      <div
        ref={mapRef}
        role="application"
        aria-label="Mappa della posizione dell’immobile"
        onPointerDown={startPan}
        onPointerMove={pan}
        onPointerUp={finishPan}
        onPointerCancel={cancelPan}
        className={`relative isolate w-full overflow-hidden bg-slate-200 ${compact ? "h-[240px]" : "h-[340px] sm:h-[390px]"} ${readOnly ? "cursor-default" : dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ touchAction: readOnly ? "auto" : "none" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {tiles.map((tile) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute h-64 w-64 max-w-none select-none"
              style={{ left: tile.left, top: tile.top }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-white shadow-2xl shadow-slate-950/40 ${verified ? "bg-emerald-600" : "bg-blue-600"}`}>
            {verified ? <Check size={24} strokeWidth={3} /> : <MapPin size={24} fill="currentColor" />}
          </div>
          <span className={`absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 ${verified ? "bg-emerald-600" : "bg-blue-600"}`} />
        </div>

        {!readOnly && (
          <div data-map-control className="absolute left-3 top-3 z-30 flex max-w-[calc(100%-5rem)] flex-col gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void locateFromAddress();
              }}
              disabled={locating}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-lg hover:bg-slate-50 disabled:opacity-60"
            >
              {locating ? <LoaderCircle size={15} className="animate-spin" /> : <LocateFixed size={15} />}
              Dall’indirizzo
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                locateCurrentPosition();
              }}
              disabled={geolocating}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-lg hover:bg-slate-50 disabled:opacity-60"
            >
              {geolocating ? <LoaderCircle size={15} className="animate-spin" /> : <Navigation size={15} />}
              La mia posizione
            </button>
          </div>
        )}

        <div data-map-control className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setZoom((value) => Math.min(MAX_ZOOM, value + 1));
            }}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Aumenta zoom"
            className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Plus size={17} />
          </button>
          <div className="h-px bg-slate-200" />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setZoom((value) => Math.max(MIN_ZOOM, value - 1));
            }}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Riduci zoom"
            className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Minus size={17} />
          </button>
        </div>

        <div data-map-control className="absolute bottom-2 right-2 z-30 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow-sm backdrop-blur">
          ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
            onClick={(event) => event.stopPropagation()}
          >
            OpenStreetMap
          </a>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 px-4 py-4">
        {locationLabel && (
          <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
            <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
            <span><strong className="text-slate-800">Punto riconosciuto:</strong> {locationLabel}</span>
          </div>
        )}

        {!readOnly && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600">
                Coordinate: {viewCenter.latitude.toFixed(6)}, {viewCenter.longitude.toFixed(6)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Sposta la mappa finché il segnaposto è sopra l’edificio corretto.</p>
            </div>
            <button
              type="button"
              onClick={() => void confirmPosition()}
              disabled={confirming || verified}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-default disabled:opacity-60"
            >
              {confirming ? <LoaderCircle size={17} className="animate-spin" /> : verified ? <ShieldCheck size={17} /> : <CheckCircle2 size={17} />}
              {verified ? "Posizione confermata" : "Conferma questo punto"}
            </button>
          </div>
        )}

        {readOnly && (
          <p className="text-xs font-semibold text-slate-500">
            Coordinate salvate: {viewCenter.latitude.toFixed(6)}, {viewCenter.longitude.toFixed(6)}
          </p>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-start gap-2 border-t border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-800">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <span>
            La posizione esatta resta nei dati della pratica. Quando creeremo l’annuncio, l’utente potrà decidere se pubblicare il punto preciso oppure soltanto la zona.
          </span>
        </div>
      )}

      {locationError && (
        <p className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">{locationError}</p>
      )}
    </section>
  );
}
