import type { TechnicalComparison, TechnicalValue } from "./types";

function normalize(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim().toLocaleLowerCase("it-IT").replace(/\s+/g," ");
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return JSON.stringify(v.map(normalize).sort());
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return JSON.stringify(Object.keys(obj).sort().reduce<Record<string, unknown>>((acc,k) => { acc[k]=obj[k]; return acc; },{}));
  }
  return String(v);
}

export function compareTechnicalValues(
  key: string,
  left?: TechnicalValue,
  right?: TechnicalValue,
  materiality: TechnicalComparison["materiality"] = "UNKNOWN",
  requiresProfessionalInterpretation = true
): TechnicalComparison {
  if (!left || !right || left.value === undefined || right.value === undefined || left.value === null || right.value === null) {
    return { key, left, right, result: "UNKNOWN", materiality, requiresProfessionalInterpretation };
  }
  const result = normalize(left.value) === normalize(right.value) ? "MATCH" : "MISMATCH";
  return { key, left, right, result, materiality, requiresProfessionalInterpretation };
}

export function comparisonStats(items: TechnicalComparison[]) {
  return {
    total: items.length,
    match: items.filter(x=>x.result==="MATCH").length,
    mismatch: items.filter(x=>x.result==="MISMATCH").length,
    unknown: items.filter(x=>x.result==="UNKNOWN").length,
    partial: items.filter(x=>x.result==="PARTIAL").length,
  };
}
