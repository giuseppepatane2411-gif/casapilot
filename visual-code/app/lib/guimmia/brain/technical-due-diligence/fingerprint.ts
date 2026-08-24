function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string,unknown>).sort().reduce<Record<string,unknown>>((acc,k)=>{
      acc[k]=canonical((value as Record<string,unknown>)[k]); return acc;
    },{});
  }
  return value;
}

/**
 * Fingerprint deterministico "logical", non crittografico.
 * Il DB può memorizzare SHA256 reale. Questo helper serve a stabilire se gli input
 * concettuali sono cambiati e se signoff/gate/snapshot vanno invalidati.
 */
export function stableInputFingerprint(value: unknown): string {
  const s = JSON.stringify(canonical(value));
  let h = 2166136261;
  for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `fnv1a:${(h>>>0).toString(16).padStart(8,"0")}`;
}

export function isSignoffCurrent(signoffFingerprint: string | undefined, currentFingerprint: string): boolean {
  return Boolean(signoffFingerprint && signoffFingerprint === currentFingerprint);
}
