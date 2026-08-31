import "server-only";

import { getOpenAIConfiguration } from "@/lib/guimmia/openai/config";
import type {
  PropertyValuationInput,
  PropertyValuationResult,
  ValuationComparableSignal,
  ValuationQuality,
  ValuationSource,
  ValuationUsage,
} from "@/lib/guimmia/openai/types";

const valuationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    currency: { type: "string", enum: ["EUR"] },
    period: { type: "string", enum: ["TOTAL", "MONTH", "NIGHT"] },
    range: {
      type: "object",
      additionalProperties: false,
      properties: {
        low: { type: "number", minimum: 0 },
        suggested: { type: "number", minimum: 0 },
        high: { type: "number", minimum: 0 },
      },
      required: ["low", "suggested", "high"],
    },
    officialBenchmark: {
      type: "object",
      additionalProperties: false,
      properties: {
        source: { type: "string", enum: ["OMI"] },
        available: { type: "boolean" },
        referencePeriod: { type: "string" },
        zone: { type: "string" },
        propertyType: { type: "string" },
        unit: {
          type: "string",
          enum: ["EUR_SQM_SALE", "EUR_SQM_MONTH"],
        },
        low: { type: "number", minimum: 0 },
        high: { type: "number", minimum: 0 },
        note: { type: "string" },
      },
      required: [
        "source",
        "available",
        "referencePeriod",
        "zone",
        "propertyType",
        "unit",
        "low",
        "high",
        "note",
      ],
    },
    valuationMethod: {
      type: "object",
      additionalProperties: false,
      properties: {
        surfaceBasis: { type: "string" },
        appliedFactors: {
          type: "array",
          items: { type: "string" },
          maxItems: 8,
        },
        note: { type: "string" },
      },
      required: ["surfaceBasis", "appliedFactors", "note"],
    },
    marketEvidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        evidenceSummary: { type: "string" },
        observedUnit: {
          type: "string",
          enum: [
            "EUR_SQM_SALE",
            "EUR_SQM_MONTH",
            "EUR_ROOM_MONTH",
            "EUR_NIGHT",
          ],
        },
        observedLow: { type: "number", minimum: 0 },
        observedMedian: { type: "number", minimum: 0 },
        observedHigh: { type: "number", minimum: 0 },
        comparableSignals: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              location: { type: "string" },
              askingPrice: { type: "number", minimum: 0 },
              surfaceSqm: { type: "number", minimum: 0 },
              pricePerSqm: { type: "number", minimum: 0 },
              similarity: {
                type: "string",
                enum: ["HIGH", "MEDIUM", "LOW"],
              },
              note: { type: "string" },
            },
            required: [
              "label",
              "location",
              "askingPrice",
              "surfaceSqm",
              "pricePerSqm",
              "similarity",
              "note",
            ],
          },
        },
      },
      required: [
        "evidenceSummary",
        "observedUnit",
        "observedLow",
        "observedMedian",
        "observedHigh",
        "comparableSignals",
      ],
    },
    rentalProjection: {
      type: "object",
      additionalProperties: false,
      properties: {
        applicable: { type: "boolean" },
        basis: {
          type: "string",
          enum: ["NONE", "ANNUAL_RENT", "ANNUAL_GROSS_REVENUE"],
        },
        occupancyLowPercent: { type: "number", minimum: 0, maximum: 100 },
        occupancyHighPercent: { type: "number", minimum: 0, maximum: 100 },
        annualLow: { type: "number", minimum: 0 },
        annualSuggested: { type: "number", minimum: 0 },
        annualHigh: { type: "number", minimum: 0 },
        note: { type: "string" },
      },
      required: [
        "applicable",
        "basis",
        "occupancyLowPercent",
        "occupancyHighPercent",
        "annualLow",
        "annualSuggested",
        "annualHigh",
        "note",
      ],
    },
    confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
    summary: { type: "string" },
    factors: { type: "array", items: { type: "string" }, maxItems: 6 },
    cautions: { type: "array", items: { type: "string" }, maxItems: 5 },
    missingData: { type: "array", items: { type: "string" }, maxItems: 6 },
    nextSteps: { type: "array", items: { type: "string" }, maxItems: 5 },
    methodology: { type: "string" },
    disclaimer: { type: "string" },
  },
  required: [
    "currency",
    "period",
    "range",
    "officialBenchmark",
    "valuationMethod",
    "marketEvidence",
    "rentalProjection",
    "confidence",
    "summary",
    "factors",
    "cautions",
    "missingData",
    "nextSteps",
    "methodology",
    "disclaimer",
  ],
} as const;

type OpenAIResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    action?: {
      sources?: Array<{
        url?: string;
        title?: string;
      }>;
    };
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{
        type?: string;
        url?: string;
        title?: string;
      }>;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
};

function outputText(response: OpenAIResponse) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("");
}

function sources(response: OpenAIResponse): ValuationSource[] {
  const unique = new Map<string, ValuationSource>();

  const addSource = (url: unknown, title: unknown) => {
    if (typeof url !== "string") return;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
      const normalizedUrl = parsed.toString();
      const normalizedTitle =
        typeof title === "string" && title.trim()
          ? title.trim().slice(0, 180)
          : parsed.hostname.replace(/^www\./, "");
      unique.set(normalizedUrl, { title: normalizedTitle, url: normalizedUrl });
    } catch {
      // Ignore malformed tool results instead of exposing them in the interface.
    }
  };

  for (const item of response.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      addSource(source.url, source.title);
    }

    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.type === "url_citation") {
          addSource(annotation.url, annotation.title);
        }
      }
    }
  }

  return Array.from(unique.values()).slice(0, 12);
}

function countWebSearchCalls(response: OpenAIResponse) {
  return (response.output ?? []).filter((item) => item.type === "web_search_call")
    .length;
}

function usage(response: OpenAIResponse): ValuationUsage {
  const inputTokens = Math.max(0, response.usage?.input_tokens ?? 0);
  const cachedInputTokens = Math.min(
    inputTokens,
    Math.max(0, response.usage?.input_tokens_details?.cached_tokens ?? 0),
  );
  const outputTokens = Math.max(0, response.usage?.output_tokens ?? 0);
  const webSearchCalls = countWebSearchCalls(response);
  const uncachedInputTokens = inputTokens - cachedInputTokens;
  const tokenCost =
    (uncachedInputTokens / 1_000_000) * 0.2 +
    (cachedInputTokens / 1_000_000) * 0.02 +
    (outputTokens / 1_000_000) * 1.2;
  const estimatedCostUsd = tokenCost + webSearchCalls * 0.01;

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    webSearchCalls,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
  };
}

function cleanComparable(value: ValuationComparableSignal) {
  if (
    !value ||
    !Number.isFinite(value.askingPrice) ||
    !Number.isFinite(value.surfaceSqm) ||
    value.askingPrice <= 0 ||
    value.surfaceSqm <= 0
  ) {
    return null;
  }

  return {
    label: String(value.label || "Annuncio comparabile").slice(0, 120),
    location: String(value.location || "Zona dichiarata").slice(0, 120),
    askingPrice: Math.round(value.askingPrice),
    surfaceSqm: Math.round(value.surfaceSqm * 10) / 10,
    pricePerSqm: Math.round((value.askingPrice / value.surfaceSqm) * 100) / 100,
    similarity: value.similarity,
    note: String(value.note || "Prezzo richiesto pubblicamente").slice(0, 220),
  } satisfies ValuationComparableSignal;
}

function addUniqueNote(items: string[], note: string) {
  return items.includes(note) ? items : [...items, note];
}

function quality(
  result: PropertyValuationResult,
  publicSources: ValuationSource[],
  input: Pick<PropertyValuationInput, "property">,
): ValuationQuality {
  const sourceCount = publicSources.length;
  const comparableCount = result.marketEvidence.comparableSignals.length;
  const optionalData = [
    input.property.postalCode,
    input.property.address,
    input.property.yearBuilt,
    input.property.energyClass,
    input.property.floor,
    input.property.monthlyCondominiumFees,
  ];
  const completedOptionalData = optionalData.filter(
    (value) => value !== undefined && value !== null && value !== "",
  ).length;
  const dataCompleteness = Math.round(
    70 + (completedOptionalData / optionalData.length) * 30,
  );
  const score = Math.min(
    100,
    14 +
      (result.officialBenchmark.available ? 12 : 0) +
      Math.min(sourceCount, 4) * 8 +
      Math.min(comparableCount, 4) * 8 +
      Math.round((dataCompleteness - 70) * 0.6),
  );
  const grade = score >= 78 ? "STRONG" : score >= 52 ? "USEFUL" : "LIMITED";
  const notes: string[] = [];

  if (sourceCount < 2) notes.push("Poche fonti pubbliche verificabili disponibili.");
  if (!result.officialBenchmark.available) {
    notes.push("Quotazione OMI puntuale non disponibile per questa ricerca.");
  }
  if (comparableCount < 2) notes.push("Campione di immobili comparabili ridotto.");
  if (!input.property.address) notes.push("La microzona non è stata indicata con precisione.");
  if (!input.property.yearBuilt) notes.push("L’anno di costruzione non è disponibile.");

  return {
    score,
    grade,
    sourceCount,
    comparableCount,
    dataCompleteness,
    notes: notes.slice(0, 4),
  };
}

function validateResult(value: unknown): PropertyValuationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("valuation_result_invalid");
  }

  const result = value as PropertyValuationResult;
  const { low, suggested, high } = result.range ?? {};
  if (
    !Number.isFinite(low) ||
    !Number.isFinite(suggested) ||
    !Number.isFinite(high) ||
    low <= 0 ||
    low > suggested ||
    suggested > high
  ) {
    throw new Error("valuation_range_invalid");
  }

  const evidence = result.marketEvidence;
  if (
    !evidence ||
    !Number.isFinite(evidence.observedLow) ||
    !Number.isFinite(evidence.observedMedian) ||
    !Number.isFinite(evidence.observedHigh) ||
    evidence.observedLow < 0 ||
    evidence.observedMedian < evidence.observedLow ||
    evidence.observedHigh < evidence.observedMedian
  ) {
    throw new Error("valuation_evidence_invalid");
  }

  const benchmark = result.officialBenchmark;
  if (
    !benchmark ||
    benchmark.source !== "OMI" ||
    !Number.isFinite(benchmark.low) ||
    !Number.isFinite(benchmark.high) ||
    benchmark.low < 0 ||
    benchmark.high < benchmark.low ||
    (benchmark.available && (benchmark.low <= 0 || benchmark.high <= 0)) ||
    (!benchmark.available && (benchmark.low !== 0 || benchmark.high !== 0))
  ) {
    throw new Error("valuation_official_benchmark_invalid");
  }

  if (!result.valuationMethod || !Array.isArray(result.valuationMethod.appliedFactors)) {
    throw new Error("valuation_method_invalid");
  }
  result.valuationMethod.appliedFactors = result.valuationMethod.appliedFactors
    .map((factor) => String(factor).trim().slice(0, 140))
    .filter(Boolean)
    .slice(0, 8);

  result.marketEvidence.comparableSignals = (
    result.marketEvidence.comparableSignals ?? []
  )
    .map(cleanComparable)
    .filter((item): item is ValuationComparableSignal => Boolean(item))
    .slice(0, 6);

  const projection = result.rentalProjection;
  if (
    !projection ||
    !Number.isFinite(projection.occupancyLowPercent) ||
    !Number.isFinite(projection.occupancyHighPercent) ||
    projection.occupancyLowPercent < 0 ||
    projection.occupancyHighPercent > 100 ||
    projection.occupancyLowPercent > projection.occupancyHighPercent ||
    !Number.isFinite(projection.annualLow) ||
    !Number.isFinite(projection.annualSuggested) ||
    !Number.isFinite(projection.annualHigh) ||
    projection.annualLow < 0 ||
    projection.annualLow > projection.annualSuggested ||
    projection.annualSuggested > projection.annualHigh
  ) {
    throw new Error("valuation_projection_invalid");
  }

  return result;
}

function applyEvidenceGuard(
  result: PropertyValuationResult,
  publicSources: ValuationSource[],
  valuationQuality: ValuationQuality,
) {
  const guarded = structuredClone(result);

  guarded.confidence =
    valuationQuality.grade === "STRONG"
      ? guarded.confidence
      : valuationQuality.grade === "USEFUL" && guarded.confidence === "HIGH"
        ? "MEDIUM"
        : "LOW";

  if (publicSources.length < 2) {
    guarded.cautions = addUniqueNote(
      guarded.cautions,
      "La ricerca ha restituito meno di due fonti pubbliche verificabili: la fascia va considerata molto preliminare.",
    ).slice(0, 5);
  }
  if (guarded.marketEvidence.comparableSignals.length < 2) {
    guarded.cautions = addUniqueNote(
      guarded.cautions,
      "Il numero di annunci comparabili è insufficiente per una lettura robusta della microzona.",
    ).slice(0, 5);
  }
  if (!guarded.officialBenchmark.available) {
    guarded.cautions = addUniqueNote(
      guarded.cautions,
      "Non è stata verificata una quotazione OMI puntuale per la zona: il riferimento ufficiale non ha contribuito numericamente alla fascia.",
    ).slice(0, 5);
  }

  return guarded;
}

export class OpenAINotConfiguredError extends Error {}

export async function generatePropertyValuation(
  input: Pick<PropertyValuationInput, "operation" | "property">,
) {
  const configuration = getOpenAIConfiguration();
  if (!configuration.configured) {
    throw new OpenAINotConfiguredError("OPENAI_API_KEY missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configuration.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: configuration.model,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: 2500,
        max_tool_calls: 3,
        tools: [
          {
            type: "web_search",
            external_web_access: true,
            filters: {
              allowed_domains: [
                "agenziaentrate.gov.it",
                "borsinoimmobiliare.it",
                "immobiliare.it",
                "idealista.it",
                "casa.it",
                "wikicasa.it",
              ],
            },
          },
        ],
        tool_choice: "required",
        include: ["web_search_call.action.sources"],
        instructions: [
          "Sei il motore di stima preliminare di Guimmia, agenzia immobiliare online italiana.",
          "Produci una fascia indicativa prudente, non una perizia e non una promessa di prezzo.",
          "Per SALE restituisci importi totali e period TOTAL; per RENT_LONG_TERM restituisci canoni mensili e period MONTH.",
          "Per RENT_ROOM restituisci il canone mensile della sola stanza, period MONTH e observedUnit EUR_ROOM_MONTH.",
          "Per RENT_SHORT_TERM restituisci una tariffa media indicativa per notte, period NIGHT e observedUnit EUR_NIGHT.",
          "Per ogni affitto compila rentalProjection: per lungo termine e stanza usa ANNUAL_RENT; per turistico usa ANNUAL_GROSS_REVENUE e una forchetta prudente di occupazione. Per SALE usa NONE, applicable false e tutti i valori numerici a zero.",
          "Applica una gerarchia esplicita: 1) quotazioni ufficiali OMI dell'Agenzia delle Entrate; 2) metodo sintetico-comparativo e coefficienti di merito; 3) annunci comparabili attuali.",
          "Per officialBenchmark usa esclusivamente una quotazione OMI verificabile su domini dell'Agenzia delle Entrate, coerente con zona, tipologia, stato e operazione. Indica periodo e zona esatti.",
          "Se non trovi una quotazione OMI puntuale e verificabile, imposta available false, low e high a 0 e spiega il limite: non stimare né inventare valori OMI.",
          "OMI non fornisce una quotazione specifica per singola stanza o tariffa turistica giornaliera: per RENT_ROOM e RENT_SHORT_TERM imposta officialBenchmark available false e non convertire arbitrariamente i valori OMI.",
          "Consulta Borsino Immobiliare soltanto come riferimento metodologico per superficie commerciale e coefficienti di merito; non presentarlo come fonte ufficiale né come partner di Guimmia.",
          "In valuationMethod spiega la base di superficie e indica solo i correttivi effettivamente applicati: stato, piano, ascensore, pertinenze, efficienza energetica, occupazione e microzona quando disponibili.",
          "Cerca immobili realmente comparabili per microzona, tipologia, superficie, stato e dotazioni.",
          "Usa gli annunci pubblici trovati online solo come segnali di prezzo richiesto, mai come prezzi finali di compravendite concluse.",
          "Non dichiarare di avere usato transazioni concluse salvo dati ufficiali sui valori dichiarati effettivamente trovati e citati.",
          "Compila comparableSignals solo con annunci che hai effettivamente trovato: non inventare prezzi, immobili, indirizzi, date o fonti.",
          "Se non trovi almeno due comparabili credibili, restituisci un campione ridotto, allarga la fascia e imposta confidence LOW.",
          "Ricalcola prezzo/m² come askingPrice diviso surfaceSqm e spiega brevemente le differenze importanti.",
          "Distingui chiaramente dati dichiarati, inferenze e limiti. Se i dati sono insufficienti allarga la fascia e abbassa la confidenza.",
          "Non stabilire il prezzo finale: la decisione resta al proprietario con il supporto dell'agenzia.",
          "Scrivi in italiano semplice, massimo sei elementi per lista, senza gergo tecnico inutile.",
          "Non chiedere né inferire dati personali del proprietario: non ti vengono trasmessi.",
          "Per la stanza considera solo caratteristiche dell'alloggio, composizione attuale dichiarata e profilo studente/lavoratore. Non inferire dati personali e non produrre criteri di esclusione automatica.",
        ].join("\n"),
        input: JSON.stringify({
          useCase: "GUIMMIA_PRELIMINARY_PROPERTY_VALUATION",
          executionMode: "DRY_RUN",
          operation: input.operation,
          property: input.property,
        }),
        text: {
          format: {
            type: "json_schema",
            name: "guimmia_property_valuation",
            strict: true,
            schema: valuationSchema,
          },
        },
      }),
    });

    const raw = (await response.json()) as OpenAIResponse;
    if (!response.ok) {
      throw new Error(raw.error?.message || `openai_http_${response.status}`);
    }

    const text = outputText(raw);
    if (!text) throw new Error("openai_empty_output");

    const rawResult = validateResult(JSON.parse(text));
    const expectedPeriod =
      input.operation === "SALE"
        ? "TOTAL"
        : input.operation === "RENT_SHORT_TERM"
          ? "NIGHT"
          : "MONTH";
    const expectedObservedUnit =
      input.operation === "SALE"
        ? "EUR_SQM_SALE"
        : input.operation === "RENT_LONG_TERM"
          ? "EUR_SQM_MONTH"
          : input.operation === "RENT_ROOM"
            ? "EUR_ROOM_MONTH"
            : "EUR_NIGHT";
    if (
      rawResult.period !== expectedPeriod ||
      rawResult.marketEvidence.observedUnit !== expectedObservedUnit
    ) {
      throw new Error("valuation_operation_unit_mismatch");
    }
    const publicSources = sources(raw);
    const valuationQuality = quality(rawResult, publicSources, input);
    const result = applyEvidenceGuard(rawResult, publicSources, valuationQuality);
    return {
      requestId: raw.id ?? crypto.randomUUID(),
      result,
      sources: publicSources,
      usage: usage(raw),
      quality: valuationQuality,
      model: configuration.model,
    };
  } finally {
    clearTimeout(timeout);
  }
}
