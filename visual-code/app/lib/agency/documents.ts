import "server-only";

export type CaseDocument = {
  id: string;
  document_type: string;
  title: string;
  status: string;
  current_version: number;
  registration_required: boolean;
  registration_deadline: string | null;
};

export async function getCaseDocuments(listingId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      source: "demo" as const,
      items: [
        { id: "d1", document_type: "purchase_offer", title: "Proposta di acquisto", status: "draft", current_version: 1, registration_required: false, registration_deadline: null },
      ] as CaseDocument[],
    };
  }

  const q = new URLSearchParams({
    select: "id,document_type,title,status,current_version,registration_required,registration_deadline",
    listing_id: `eq.${listingId}`,
    order: "created_at.desc",
  });

  try {
    const r = await fetch(`${url}/rest/v1/agency_documents?${q.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!r.ok) throw new Error("documents fetch failed");
    return { source: "supabase" as const, items: (await r.json()) as CaseDocument[] };
  } catch {
    return { source: "demo" as const, items: [] as CaseDocument[] };
  }
}
