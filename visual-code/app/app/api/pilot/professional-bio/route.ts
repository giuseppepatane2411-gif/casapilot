import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  notes?: string;
  displayName?: string;
  legalName?: string;
  serviceLabels?: string[];
  yearsExperience?: number;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function guidedDraft(body: Body) {
  const notes = clean(body.notes);
  const name = clean(body.displayName) || clean(body.legalName) || "L’attività";
  const services = Array.isArray(body.serviceLabels)
    ? body.serviceLabels.map(clean).filter(Boolean).slice(0, 6)
    : [];
  const years = Number(body.yearsExperience ?? 0);
  const experience = years > 0 ? ` con ${years} ${years === 1 ? "anno" : "anni"} di esperienza` : "";
  const serviceCopy = services.length > 0 ? ` Ci occupiamo in particolare di ${services.join(", ")}.` : "";
  const noteCopy = notes ? ` ${notes.replace(/\s+/g, " ")}` : "";
  return `${name} offre servizi professionali dedicati alla cura e alla gestione degli immobili${experience}.${serviceCopy}${noteCopy}`.trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }
  const { data: roleRows } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_id", authData.user.id);
  if (!(roleRows ?? []).some((row) => row.role === "professional" || row.role === "admin")) {
    return NextResponse.json({ error: "professional_role_required" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const notes = clean(body.notes);
  if (notes.length < 12) {
    return NextResponse.json({ error: "notes_too_short" }, { status: 400 });
  }
  if (notes.length > 2500) {
    return NextResponse.json({ error: "notes_too_long" }, { status: 413 });
  }

  const endpoint = process.env.CASAPILOT_AI_ENDPOINT;
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.CASAPILOT_AI_TOKEN
            ? { authorization: `Bearer ${process.env.CASAPILOT_AI_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          task: "professional_bio",
          language: "it",
          input: body,
          constraints: {
            tone: "professional, clear, factual",
            maxCharacters: 900,
            doNotInventQualifications: true,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const payload = (await response.json()) as { text?: string };
        if (payload.text?.trim()) {
          return NextResponse.json({ text: payload.text.trim(), mode: "ai" });
        }
      }
    } catch {
      // Fallback guidato: non viene presentato come output AI.
    }
  }

  return NextResponse.json({
    text: guidedDraft(body),
    mode: "guided",
    notice: "Il modello AI non è ancora collegato: questa è una bozza guidata locale. Il testo resta sempre modificabile prima del salvataggio.",
  });
}
