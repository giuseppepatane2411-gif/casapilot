import { NextResponse } from "next/server";

import {
  buildPropertyJourney,
  isOperationType,
  isPropertyType,
  parsePropertyJourney,
} from "@/lib/property-journey/model";
import type {
  OperationType,
  PropertyJourney,
  PropertyType,
} from "@/lib/property-journey/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const JOURNEY_SELECT = [
  "id",
  "owner_user_id",
  "source_property_ref",
  "operation",
  "property_type",
  "title",
  "city",
  "province",
  "zone",
  "address_public",
  "latitude",
  "longitude",
  "surface_sqm",
  "status",
  "created_at",
  "updated_at",
].join(",");

const OWNER_JOURNEY_SELECT = [
  "listing_id",
  "owner_user_id",
  "journey_data",
  "journey_schema_version",
  "wizard_completed_at",
  "created_at",
  "updated_at",
].join(",");

type AgencyListingRow = {
  id: string;
  owner_user_id: string | null;
  source_property_ref: string | null;
  operation: "sale" | "rent";
  property_type: string;
  title: string;
  city: string;
  province: string | null;
  zone: string | null;
  address_public: string | null;
  latitude: number | null;
  longitude: number | null;
  surface_sqm: number | string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type AgencyOwnerJourneyRow = {
  listing_id: string;
  owner_user_id: string;
  journey_data: unknown;
  journey_schema_version: number;
  wizard_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type OwnerContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string };
};

type JourneyRequest = {
  journey: PropertyJourney;
  conversationId?: string;
};

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

function operationForListing(operation: OperationType): "sale" | "rent" {
  return operation === "sale" ? "sale" : "rent";
}

function rentPeriod(operation: OperationType) {
  if (operation === "sale") return null;
  return operation === "rent_tourist_short" ? "day" : "month";
}

function sourceReference(operation: OperationType) {
  return `guimmia-owner-journey-v1:${operation}`;
}

function propertyTypeForListing(propertyType: PropertyType) {
  const labels: Record<PropertyType, string> = {
    apartment: "Appartamento",
    house: "Casa o villa",
    commercial: "Locale commerciale",
    land: "Terreno",
    garage: "Garage",
    room: "Stanza",
  };
  return labels[propertyType];
}

function operationFromRow(row: AgencyListingRow): OperationType {
  const sourceOperation = row.source_property_ref?.split(":").at(-1);
  if (isOperationType(sourceOperation)) return sourceOperation;
  return row.operation === "sale" ? "sale" : "rent";
}

function fallbackPropertyType(value: string): PropertyType {
  if (isPropertyType(value)) return value;
  const normalized = value.toLowerCase();
  if (normalized.includes("stanza")) return "room";
  if (normalized.includes("villa") || normalized.includes("casa")) return "house";
  if (normalized.includes("commercial") || normalized.includes("ufficio")) return "commercial";
  if (normalized.includes("terreno")) return "land";
  if (normalized.includes("garage") || normalized.includes("box")) return "garage";
  return "apartment";
}

function roomListingFields(journey: PropertyJourney) {
  const isRoom = journey.property.type === "room";
  const room = journey.property.roomRental;
  const roomSurface = Number(room.roomSurface);
  const roommates = Number(room.currentRoommates);

  return {
    listing_kind: isRoom ? "room" : "whole_property",
    room_type: isRoom ? room.roomType || null : null,
    room_surface_sqm:
      isRoom && Number.isFinite(roomSurface) ? roomSurface : null,
    private_bathroom: isRoom ? room.privateBathroom : null,
    current_roommates_count:
      isRoom && Number.isInteger(roommates) ? roommates : null,
    current_household_summary: isRoom
      ? room.householdComposition || null
      : null,
    accepted_occupant_profiles: isRoom
      ? room.acceptedOccupantProfiles
      : [],
    available_from: isRoom ? room.availableFrom || null : null,
    expenses_included: isRoom ? room.expensesIncluded : null,
  };
}

function rowToJourney(
  row: AgencyListingRow,
  privateRow?: AgencyOwnerJourneyRow,
): PropertyJourney {
  const storedJourney =
    privateRow?.journey_data && typeof privateRow.journey_data === "object"
      ? parsePropertyJourney({
          ...(privateRow.journey_data as Record<string, unknown>),
          id: row.id,
          createdAt: privateRow.created_at,
          updatedAt: privateRow.updated_at,
        })
      : null;

  if (storedJourney) return storedJourney;

  const numericSurface =
    row.surface_sqm === null ? NaN : Number(row.surface_sqm);

  return buildPropertyJourney(
    {
      operation: operationFromRow(row),
      propertyType: fallbackPropertyType(row.property_type),
      propertyName: row.title,
      surface: Number.isFinite(numericSurface) ? String(numericSurface) : "",
      occupancy: "",
      country: "Italia",
      city: row.city,
      province: row.province || "Da completare",
      address: row.address_public || row.zone || row.city,
      postalCode: "Da completare",
      cadastralSheet: "",
      cadastralParcel: "",
      cadastralSubaltern: "",
      latitude: row.latitude,
      longitude: row.longitude,
      locationVerified: false,
      locationVerifiedAt: "",
      locationLabel: "",
      roomRental: {
        roomType: "",
        roomSurface: "",
        privateBathroom: false,
        roomFurnished: false,
        currentRoommates: "0",
        householdComposition: "not_specified",
        acceptedOccupantProfiles: [],
        genderPreference: "none",
        availableFrom: "",
        expensesIncluded: false,
        compatibilityNotes: "",
      },
      documents: [],
    },
    {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  );
}

function saveRpcArguments(
  journey: PropertyJourney,
  mode: "create" | "update",
) {
  const room = roomListingFields(journey);
  return {
    p_mode: mode,
    p_journey_id: journey.id,
    p_source_property_ref: sourceReference(journey.operation),
    p_operation: operationForListing(journey.operation),
    p_property_type: propertyTypeForListing(journey.property.type),
    p_title: journey.property.name,
    p_rent_period: rentPeriod(journey.operation),
    p_city: journey.property.city,
    p_province: journey.property.province,
    p_surface_sqm: journey.property.surface,
    p_listing_kind: room.listing_kind,
    p_room_type: room.room_type,
    p_room_surface_sqm: room.room_surface_sqm,
    p_private_bathroom: room.private_bathroom,
    p_current_roommates_count: room.current_roommates_count,
    p_current_household_summary: room.current_household_summary,
    p_accepted_occupant_profiles: room.accepted_occupant_profiles,
    p_available_from: room.available_from,
    p_expenses_included: room.expenses_included,
    p_journey_data: journey,
    p_wizard_completed_at: journey.createdAt,
  };
}

async function authenticatedContext() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

async function requestJourney(request: Request): Promise<JourneyRequest | null> {
  try {
    const body = (await request.json()) as {
      journey?: unknown;
      conversationId?: unknown;
    };
    const journey = parsePropertyJourney(body.journey);
    if (!journey) return null;
    const conversationId =
      typeof body.conversationId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.conversationId,
      )
        ? body.conversationId
        : undefined;
    return { journey, conversationId };
  } catch {
    return null;
  }
}

async function readPersistedJourney(
  context: OwnerContext,
  journeyId: string,
) {
  const { data: listingData, error: listingError } = await context.supabase
    .from("agency_listings")
    .select(JOURNEY_SELECT)
    .eq("id", journeyId)
    .eq("owner_user_id", context.user.id)
    .single();

  if (listingError || !listingData) {
    if (listingError) {
      console.error("Guimmia persisted listing read failed", listingError);
    }
    return null;
  }

  const { data: privateData, error: privateError } = await context.supabase
    .from("agency_owner_journeys")
    .select(OWNER_JOURNEY_SELECT)
    .eq("listing_id", journeyId)
    .eq("owner_user_id", context.user.id)
    .single();

  if (privateError || !privateData) {
    if (privateError) {
      console.error("Guimmia persisted private journey read failed", privateError);
    }
    return null;
  }

  return rowToJourney(
    listingData as unknown as AgencyListingRow,
    privateData as unknown as AgencyOwnerJourneyRow,
  );
}

async function persistJourney(
  context: OwnerContext,
  journey: PropertyJourney,
  mode: "create" | "update",
) {
  const { error } = await context.supabase.rpc(
    "guimmia_save_owner_journey",
    saveRpcArguments(journey, mode),
  );

  if (error) {
    console.error(`Guimmia owner journey ${mode} failed`, error);
    return null;
  }

  return readPersistedJourney(context, journey.id);
}

export async function GET() {
  const context = await authenticatedContext();
  if (!context) {
    return noStoreJson(
      { message: "Accedi di nuovo per caricare i tuoi immobili." },
      { status: 401 },
    );
  }

  const { data, error } = await context.supabase
    .from("agency_listings")
    .select(JOURNEY_SELECT)
    .eq("owner_user_id", context.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Guimmia owner journeys GET failed", error);
    return noStoreJson(
      { message: "I tuoi immobili non sono disponibili in questo momento." },
      { status: 503 },
    );
  }

  const listings = (data ?? []) as unknown as AgencyListingRow[];
  let privateRows: AgencyOwnerJourneyRow[] = [];

  if (listings.length > 0) {
    const { data: ownerData, error: ownerError } = await context.supabase
      .from("agency_owner_journeys")
      .select(OWNER_JOURNEY_SELECT)
      .eq("owner_user_id", context.user.id)
      .in("listing_id", listings.map((listing) => listing.id));

    if (ownerError) {
      console.error("Guimmia private owner journeys GET failed", ownerError);
      return noStoreJson(
        { message: "Le pratiche private non sono disponibili in questo momento." },
        { status: 503 },
      );
    }

    privateRows = (ownerData ?? []) as unknown as AgencyOwnerJourneyRow[];
  }

  const privateByListing = new Map(
    privateRows.map((privateRow) => [privateRow.listing_id, privateRow]),
  );
  const journeys = listings.map((listing) =>
    rowToJourney(listing, privateByListing.get(listing.id)),
  );
  return noStoreJson({ journeys, userId: context.user.id });
}

export async function POST(request: Request) {
  const context = await authenticatedContext();
  if (!context) {
    return noStoreJson(
      { message: "La sessione è scaduta. Accedi di nuovo e riprova." },
      { status: 401 },
    );
  }

  const requested = await requestJourney(request);
  if (!requested) {
    return noStoreJson(
      { message: "I dati dell’immobile sono incompleti o non validi." },
      { status: 400 },
    );
  }

  const journey: PropertyJourney = {
    ...requested.journey,
    updatedAt: new Date().toISOString(),
  };
  const savedJourney = await persistJourney(context, journey, "create");

  if (!savedJourney) {
    return noStoreJson(
      { message: "Non siamo riusciti a creare la pratica. La bozza è ancora disponibile." },
      { status: 503 },
    );
  }

  if (requested.conversationId) {
    const { error: linkError } = await context.supabase
      .from("guimmia_ai_practice_links")
      .upsert(
        {
          conversation_id: requested.conversationId,
          listing_id: savedJourney.id,
          user_id: context.user.id,
        },
        { onConflict: "conversation_id" },
      );
    if (linkError) {
      console.error("Guimmia AI practice link failed", linkError);
      return noStoreJson(
        {
          message:
            "La pratica è stata creata, ma il collegamento con la conversazione AI non è riuscito. Riapri la pratica dalla dashboard.",
          journey: savedJourney,
          userId: context.user.id,
        },
        { status: 503 },
      );
    }
  }

  return noStoreJson(
    {
      journey: savedJourney,
      userId: context.user.id,
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const context = await authenticatedContext();
  if (!context) {
    return noStoreJson(
      { message: "La sessione è scaduta. Accedi di nuovo e riprova." },
      { status: 401 },
    );
  }

  const requested = await requestJourney(request);
  if (!requested) {
    return noStoreJson(
      { message: "Le modifiche contengono dati non validi." },
      { status: 400 },
    );
  }

  const journey: PropertyJourney = {
    ...requested.journey,
    updatedAt: new Date().toISOString(),
  };
  const savedJourney = await persistJourney(context, journey, "update");

  if (!savedJourney) {
    return noStoreJson(
      { message: "Non siamo riusciti a salvare le modifiche. Riprova senza chiudere la pagina." },
      { status: 503 },
    );
  }

  return noStoreJson({
    journey: savedJourney,
    userId: context.user.id,
  });
}

export async function DELETE(request: Request) {
  const context = await authenticatedContext();
  if (!context) {
    return noStoreJson(
      { message: "La sessione è scaduta. Accedi di nuovo e riprova." },
      { status: 401 },
    );
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return noStoreJson({ message: "Identificativo immobile mancante." }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("agency_listings")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Guimmia owner journeys DELETE failed", error);
    return noStoreJson(
      { message: "Non siamo riusciti a eliminare l’immobile." },
      { status: error ? 503 : 404 },
    );
  }

  return noStoreJson({ deletedId: data.id });
}
