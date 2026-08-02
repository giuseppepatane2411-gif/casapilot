import {
  LEGACY_PRODUCT_STATE_STORAGE_KEYS,
  PRODUCT_STATE_CHANGE_EVENT,
  PRODUCT_STATE_STORAGE_KEY,
} from "@/lib/product/constants";
import type {
  ProductEvent,
  ProductEventType,
  ProductMilestone,
  ProductState,
} from "@/lib/product/types";

const INITIAL_PRODUCT_STATE: ProductState = {
  version: 1,
  milestones: [],
  events: [],
};

function isBrowser() {
  return typeof window !== "undefined";
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emitChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(PRODUCT_STATE_CHANGE_EVENT));
}

function normalizeMilestones(value: unknown): ProductMilestone[] {
  if (!Array.isArray(value)) return [];
  const allowed: ProductMilestone[] = [
    "journey-created",
    "pilot-opened",
    "mission-completed",
    "vault-used",
  ];
  return Array.from(
    new Set(value.filter((item): item is ProductMilestone => allowed.includes(item))),
  );
}

function normalizeEvents(value: unknown): ProductEvent[] {
  if (!Array.isArray(value)) return [];
  const allowed: ProductEventType[] = [
    "journey-created",
    "pilot-opened",
    "mission-completed",
    "vault-file-added",
  ];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .filter((item) => allowed.includes(item.type as ProductEventType))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : createId("event"),
      type: item.type as ProductEventType,
      createdAt:
        typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      journeyId: typeof item.journeyId === "string" ? item.journeyId : null,
      metadata:
        item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
          ? (item.metadata as ProductEvent["metadata"])
          : undefined,
    }))
    .slice(0, 300);
}

function migrateLegacyState(): ProductState {
  if (!isBrowser()) return INITIAL_PRODUCT_STATE;

  for (const key of LEGACY_PRODUCT_STATE_STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const migrated: ProductState = {
        version: 1,
        milestones: normalizeMilestones(parsed.milestones),
        events: normalizeEvents(parsed.events),
      };
      writeProductState(migrated);
      return migrated;
    } catch {
      // Prova l'eventuale chiave precedente.
    }
  }

  return INITIAL_PRODUCT_STATE;
}

export function readProductState(): ProductState {
  if (!isBrowser()) return INITIAL_PRODUCT_STATE;
  const raw = window.localStorage.getItem(PRODUCT_STATE_STORAGE_KEY);
  if (!raw) return migrateLegacyState();

  try {
    const parsed = JSON.parse(raw) as Partial<ProductState>;
    return {
      version: 1,
      milestones: normalizeMilestones(parsed.milestones),
      events: normalizeEvents(parsed.events),
    };
  } catch {
    return migrateLegacyState();
  }
}

export function writeProductState(state: ProductState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PRODUCT_STATE_STORAGE_KEY, JSON.stringify(state));
  emitChange();
}

export function replaceProductState(value: unknown) {
  if (!value || typeof value !== "object") return;
  const parsed = value as Partial<ProductState> & {
    milestones?: unknown;
    events?: unknown;
  };
  writeProductState({
    version: 1,
    milestones: normalizeMilestones(parsed.milestones),
    events: normalizeEvents(parsed.events),
  });
}

export function trackProductEvent(
  type: ProductEventType,
  options: {
    journeyId?: string | null;
    metadata?: ProductEvent["metadata"];
  } = {},
) {
  const state = readProductState();
  const event: ProductEvent = {
    id: createId("event"),
    type,
    createdAt: new Date().toISOString(),
    journeyId: options.journeyId ?? null,
    metadata: options.metadata,
  };

  writeProductState({
    ...state,
    events: [event, ...state.events].slice(0, 300),
  });
  return event;
}

export function markProductMilestone(milestone: ProductMilestone) {
  const state = readProductState();
  if (state.milestones.includes(milestone)) return;
  writeProductState({
    ...state,
    milestones: [...state.milestones, milestone],
  });
}
