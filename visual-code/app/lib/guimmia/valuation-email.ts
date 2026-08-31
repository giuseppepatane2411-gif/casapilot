import "server-only";

import type {
  PropertyValuationResult,
  ValuationOperation,
} from "@/lib/guimmia/openai/types";

export type ValuationEmailDelivery = "SENT" | "NOT_CONFIGURED" | "FAILED";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number, period: PropertyValuationResult["period"]) {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

  if (period === "MONTH") return `${formatted}/mese`;
  if (period === "NIGHT") return `${formatted}/notte`;
  return formatted;
}

function operationLabel(operation: ValuationOperation) {
  return {
    SALE: "vendita",
    RENT_LONG_TERM: "affitto",
    RENT_SHORT_TERM: "affitto turistico",
    RENT_ROOM: "affitto stanza",
  }[operation];
}

export async function sendValuationEmail(input: {
  to: string;
  name: string;
  operation: ValuationOperation;
  result: PropertyValuationResult;
  continuationUrl: string;
}): Promise<ValuationEmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.GUIMMIA_EMAIL_FROM?.trim();
  if (!apiKey || !from) return "NOT_CONFIGURED";

  const firstName = escapeHtml(input.name.trim().split(/\s+/)[0] || "cliente");
  const label = operationLabel(input.operation);
  const result = input.result;
  const annualProjection = result.rentalProjection.applicable
    ? `<p style="margin:16px 0 0;color:#334155;font-size:15px;line-height:1.6"><strong>Proiezione annua indicativa:</strong> ${money(result.rentalProjection.annualLow, "TOTAL")} – ${money(result.rentalProjection.annualHigh, "TOTAL")}. ${escapeHtml(result.rentalProjection.note)}</p>`
    : "";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      from,
      to: [input.to],
      subject: `La tua valutazione Guimmia per ${label}`,
      html: `
        <div style="background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden">
            <div style="background:#071126;padding:28px;color:#ffffff">
              <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Guimmia · valutazione preliminare</p>
              <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">Ciao ${firstName}, ecco la tua stima.</h1>
            </div>
            <div style="padding:28px">
              <p style="margin:0;color:#475569;font-size:15px;line-height:1.6">La fascia indicativa elaborata per il tuo obiettivo di ${label} è:</p>
              <div style="margin:20px 0;padding:20px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center">
                <p style="margin:0;color:#1d4ed8;font-size:13px;font-weight:700;text-transform:uppercase">Valore indicativo</p>
                <p style="margin:8px 0 0;color:#0f172a;font-size:32px;font-weight:800">${money(result.range.suggested, result.period)}</p>
                <p style="margin:8px 0 0;color:#475569;font-size:14px">Fascia ${money(result.range.low, result.period)} – ${money(result.range.high, result.period)}</p>
              </div>
              <p style="margin:0;color:#334155;font-size:15px;line-height:1.6">${escapeHtml(result.summary)}</p>
              ${annualProjection}
              <div style="margin:24px 0 0;padding:18px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0">
                <p style="margin:0;color:#0f172a;font-size:15px;font-weight:700">La fascia è preliminare, non il prezzo da pubblicare.</p>
                <p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6">Apri la pratica: Guimmia conserverà i dati già inseriti e un agente potrà controllare la stima prima di qualsiasi pubblicazione.</p>
                <a href="${escapeHtml(input.continuationUrl)}" style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">Apri la pratica con Guimmia</a>
              </div>
              <p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6">${escapeHtml(result.disclaimer)}</p>
            </div>
          </div>
        </div>
      `,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) {
      console.error("Guimmia valuation email failed", response.status, await response.text());
      return "FAILED";
    }

    return "SENT";
  } catch (caught) {
    console.error("Guimmia valuation email failed", caught);
    return "FAILED";
  }
}
