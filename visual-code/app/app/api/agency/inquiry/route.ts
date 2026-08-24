import { NextResponse } from "next/server";

const clean = (x: unknown, n: number) =>
  typeof x === "string" ? x.trim().slice(0, n) : "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  if (clean(body.website, 100)) return NextResponse.json({ ok: true });

  const listingId = clean(body.listingId, 60);
  const slug = clean(body.slug, 180);
  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const message = clean(body.message, 2000);
  const preferredDate = clean(body.preferredDate, 30);
  const wantsVisit = body.wantsVisit === true;
  const privacy = body.privacy === true;

  if (!listingId || !slug || !name || !email || !message || !privacy)
    return NextResponse.json({ error: "Compila tutti i campi obbligatori." }, { status: 400 });

  if (!email.includes("@"))
    return NextResponse.json({ error: "Email non valida." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    return NextResponse.json({ error: "Servizio contatti non ancora configurato." }, { status: 503 });

  const r = await fetch(`${url}/rest/v1/agency_inquiries`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      listing_id: listingId,
      listing_slug: slug,
      name,
      email,
      phone: phone || null,
      message,
      wants_visit: wantsVisit,
      preferred_date: preferredDate || null,
      privacy_accepted_at: new Date().toISOString(),
      source: "guimmia_showcase",
      status: "new",
    }),
  });

  if (!r.ok) {
    console.error("agency inquiry failed", r.status, await r.text());
    return NextResponse.json({ error: "Non siamo riusciti a registrare la richiesta." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
