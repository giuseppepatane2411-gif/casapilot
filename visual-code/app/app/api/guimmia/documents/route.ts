import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  analyzeGuimmiaDocument,
} from "@/lib/guimmia/openai/document-organizer";
import {
  GUIMMIA_AI_MONTHLY_BUDGET_USD,
  GUIMMIA_DOCUMENT_MAX_FILE_BYTES,
  GUIMMIA_DOCUMENT_MAX_REQUEST_COST_USD,
  GUIMMIA_DOCUMENT_RATE_LIMIT_REQUESTS,
  GUIMMIA_DOCUMENT_RATE_LIMIT_WINDOW_MINUTES,
} from "@/lib/guimmia/openai/config";
import {
  GUIMMIA_DOCUMENT_CATEGORIES,
  GUIMMIA_DOCUMENT_FOLDERS,
  GUIMMIA_DOCUMENT_RECIPIENTS,
  type GuimmiaDocumentAnalysisSuccess,
  type GuimmiaDocumentCategory,
  type GuimmiaDocumentError,
  type GuimmiaDocumentFolder,
  type GuimmiaDocumentListSuccess,
  type GuimmiaDocumentRecipient,
  type GuimmiaDocumentRecord,
} from "@/lib/guimmia/operations/document-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/rtf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type RateLimitEntry = { count: number; resetAt: number };
const globalLimits = globalThis as typeof globalThis & {
  __guimmiaDocumentLimits?: Map<string, RateLimitEntry>;
};
const limits = globalLimits.__guimmiaDocumentLimits ?? new Map<string, RateLimitEntry>();
globalLimits.__guimmiaDocumentLimits = limits;

type DocumentRow = {
  id: string;
  draft_id: string;
  original_name: string;
  suggested_name: string;
  mime_type: string;
  size_bytes: number | string;
  document_type: GuimmiaDocumentRecord["documentType"];
  category: GuimmiaDocumentCategory;
  folder_code: GuimmiaDocumentFolder;
  recipient_roles: GuimmiaDocumentRecipient[];
  quality: GuimmiaDocumentRecord["quality"];
  summary: string;
  warnings: string[];
  missing_followups: string[];
  confidence: number | string;
  status: GuimmiaDocumentRecord["status"];
  created_at: string;
  confirmed_at: string | null;
  send_status: "NOT_SENT";
};

function error(status: number, code: string, message: string) {
  return NextResponse.json<GuimmiaDocumentError>(
    { ok: false, error: code, message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "")
    .slice(0, 120) || "documento";
}

function access() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

function headers(prefer?: string) {
  const current = access();
  if (!current) throw new Error("supabase_not_configured");
  return {
    apikey: current.key,
    Authorization: `Bearer ${current.key}`,
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function rest<T>(path: string, init: RequestInit = {}) {
  const current = access();
  if (!current) throw new Error("supabase_not_configured");
  const response = await fetch(`${current.url}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Guimmia document database request failed", response.status);
    throw new Error(`supabase_http_${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

function rowToDocument(row: DocumentRow): GuimmiaDocumentRecord {
  return {
    id: row.id,
    draftId: row.draft_id,
    originalName: row.original_name,
    suggestedName: row.suggested_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    documentType: row.document_type,
    category: row.category,
    folderCode: row.folder_code,
    recipientRoles: row.recipient_roles ?? [],
    quality: row.quality,
    summary: row.summary,
    warnings: row.warnings ?? [],
    missingFollowups: row.missing_followups ?? [],
    confidence: Number(row.confidence),
    status: row.status,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    sendStatus: "NOT_SENT",
  };
}

async function authenticatedUser() {
  if (!isSupabaseConfigured() || !access()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

function consumeRateLimit(identity: string) {
  const now = Date.now();
  const windowMs = GUIMMIA_DOCUMENT_RATE_LIMIT_WINDOW_MINUTES * 60_000;
  const current = limits.get(identity);
  if (!current || current.resetAt <= now) {
    limits.set(identity, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= GUIMMIA_DOCUMENT_RATE_LIMIT_REQUESTS) return false;
  current.count += 1;
  return true;
}

async function budgetAvailable() {
  try {
    const rows = await rest<Array<{ remaining_usd?: string | number }>>(
      "rpc/guimmia_v773_ai_budget_status",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
    );
    return Number(rows[0]?.remaining_usd) >= GUIMMIA_DOCUMENT_MAX_REQUEST_COST_USD;
  } catch {
    return false;
  }
}

async function uploadPrivate(path: string, bytes: Buffer, mimeType: string) {
  const current = access();
  if (!current) throw new Error("supabase_not_configured");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${current.url}/storage/v1/object/guimmia-documents/${encodedPath}`,
    {
      method: "POST",
      headers: {
        ...headers(),
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body: new Uint8Array(bytes),
    },
  );
  if (!response.ok) {
    console.error("Guimmia private upload failed", response.status);
    throw new Error(`storage_http_${response.status}`);
  }
}

async function deletePrivate(path: string) {
  const current = access();
  if (!current) return;
  await fetch(`${current.url}/storage/v1/object/guimmia-documents`, {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  }).catch(() => undefined);
}

export async function GET(request: Request) {
  const user = await authenticatedUser();
  if (!user) return error(401, "authentication_required", "Accedi per vedere i documenti della pratica.");
  const draftId = cleanText(new URL(request.url).searchParams.get("draftId"), 120);
  if (!draftId) return error(400, "invalid_request", "Pratica non valida.");
  try {
    const query = new URLSearchParams({
      select: "id,draft_id,original_name,suggested_name,mime_type,size_bytes,document_type,category,folder_code,recipient_roles,quality,summary,warnings,missing_followups,confidence,status,created_at,confirmed_at,send_status",
      user_id: `eq.${user.id}`,
      draft_id: `eq.${draftId}`,
      status: "neq.REJECTED",
      order: "created_at.desc",
    });
    const rows = await rest<DocumentRow[]>(`guimmia_case_document_staging?${query}`);
    return NextResponse.json<GuimmiaDocumentListSuccess>(
      { ok: true, documents: rows.map(rowToDocument) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return error(503, "document_store_unavailable", "L’archivio documentale non è disponibile.");
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > GUIMMIA_DOCUMENT_MAX_FILE_BYTES + 1_000_000) {
    return error(413, "file_too_large", "Il documento supera il limite di 10 MB.");
  }
  const user = await authenticatedUser();
  if (!user) return error(401, "authentication_required", "Accedi per caricare un documento.");
  if (!consumeRateLimit(user.id)) {
    return error(429, "request_limit_reached", "Hai analizzato molti documenti. Riprova più tardi.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "invalid_request", "Caricamento non valido.");
  }
  const file = form.get("file");
  const draftId = cleanText(form.get("draftId"), 120);
  if (!(file instanceof File) || !draftId) {
    return error(400, "invalid_request", "Seleziona un documento e una pratica valida.");
  }
  if (!allowedMimeTypes.has(file.type)) {
    return error(415, "unsupported_file", "Formato non supportato. Usa PDF, DOC, DOCX, RTF, TXT, JPG, PNG o WebP.");
  }
  if (file.size <= 0 || file.size > GUIMMIA_DOCUMENT_MAX_FILE_BYTES) {
    return error(413, "file_too_large", "Il documento deve essere compreso tra 1 byte e 10 MB.");
  }
  if (!(await budgetAvailable())) {
    return error(429, "budget_limit_reached", `Il budget OpenAI di prova di $${GUIMMIA_AI_MONTHLY_BUDGET_USD.toFixed(2)} non è disponibile.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  try {
    const duplicateQuery = new URLSearchParams({
      select: "id,draft_id,original_name,suggested_name,mime_type,size_bytes,document_type,category,folder_code,recipient_roles,quality,summary,warnings,missing_followups,confidence,status,created_at,confirmed_at,send_status",
      user_id: `eq.${user.id}`,
      draft_id: `eq.${draftId}`,
      sha256: `eq.${sha256}`,
      status: "neq.REJECTED",
      limit: "1",
    });
    const existing = await rest<DocumentRow[]>(`guimmia_case_document_staging?${duplicateQuery}`);
    if (existing[0]) {
      return NextResponse.json<GuimmiaDocumentAnalysisSuccess>({
        ok: true,
        document: rowToDocument(existing[0]),
        assistantMessage: "Questo documento era già presente. Ti mostro la classificazione esistente senza un nuovo costo OpenAI.",
        model: "gpt-5.6-luna",
        auditSaved: true,
        safety: { humanConfirmationRequired: true, legalValidityCertified: false, documentSent: false, privateStorage: true },
      });
    }
  } catch {
    return error(503, "document_store_unavailable", "Non riesco a controllare l’archivio documentale.");
  }

  const documentId = crypto.randomUUID();
  const interactionId = crypto.randomUUID();
  const storagePath = `users/${user.id}/drafts/${safeName(draftId)}/${documentId}/${safeName(file.name)}`;
  try {
    const ai = await analyzeGuimmiaDocument({
      bytes,
      filename: file.name,
      mimeType: file.type,
      draftId,
    });
    if (ai.usage.estimatedCostUsd > GUIMMIA_DOCUMENT_MAX_REQUEST_COST_USD) {
      throw new Error("document_request_cost_guard");
    }
    await uploadPrivate(storagePath, bytes, file.type);
    let rows: DocumentRow[];
    try {
      rows = await rest<DocumentRow[]>("guimmia_case_document_staging", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          id: documentId,
          user_id: user.id,
          draft_id: draftId,
          storage_bucket: "guimmia-documents",
          storage_path: storagePath,
          original_name: file.name.slice(0, 180),
          suggested_name: ai.result.suggestedName,
          mime_type: file.type,
          size_bytes: file.size,
          sha256,
          document_type: ai.result.documentType,
          category: ai.result.category,
          folder_code: ai.result.folderCode,
          recipient_roles: ai.result.recipientRoles,
          quality: ai.result.quality,
          summary: ai.result.summary,
          warnings: ai.result.warnings,
          missing_followups: ai.result.missingFollowups,
          confidence: ai.result.confidence,
          status: "PENDING_CONFIRMATION",
          human_confirmation_required: true,
          legal_validity_certified: false,
          automatic_send_enabled: false,
          send_status: "NOT_SENT",
          ai_result: ai.result,
        }),
      });
    } catch (cause) {
      await deletePrivate(storagePath);
      throw cause;
    }
    await rest("guimmia_ai_document_interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        id: interactionId,
        user_id: user.id,
        document_id: documentId,
        draft_id: draftId,
        request_fingerprint: createHash("sha256").update(`${user.id}:${draftId}:${sha256}`).digest("hex"),
        file_hash: sha256,
        model: ai.model,
        execution_mode: "PROPOSAL_ONLY",
        status: "COMPLETED",
        response_id: ai.requestId,
        ai_result: ai.result,
        input_tokens: ai.usage.inputTokens,
        cached_input_tokens: ai.usage.cachedInputTokens,
        output_tokens: ai.usage.outputTokens,
        estimated_cost_usd: ai.usage.estimatedCostUsd,
        human_confirmation_required: true,
        automatic_archive_executed: false,
        automatic_send_executed: false,
      }),
    });
    await rest("guimmia_ai_usage_events", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        document_interaction_id: interactionId,
        request_id: ai.requestId,
        use_case: "DOCUMENT_ORGANIZATION",
        model: ai.model,
        execution_mode: "DRY_RUN",
        status: "COMPLETED",
        input_tokens: ai.usage.inputTokens,
        cached_input_tokens: ai.usage.cachedInputTokens,
        output_tokens: ai.usage.outputTokens,
        web_search_calls: 0,
        file_search_calls: 0,
        estimated_cost_usd: ai.usage.estimatedCostUsd,
      }),
    });
    return NextResponse.json<GuimmiaDocumentAnalysisSuccess>(
      {
        ok: true,
        document: rowToDocument(rows[0]),
        assistantMessage: ai.result.assistantMessage,
        model: ai.model,
        auditSaved: true,
        safety: { humanConfirmationRequired: true, legalValidityCertified: false, documentSent: false, privateStorage: true },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (cause) {
    console.error("Guimmia document organization failed", cause);
    return error(502, "document_analysis_failed", "Guimmia non è riuscita a leggere il documento. Il file non è stato archiviato.");
  }
}

export async function PATCH(request: Request) {
  const user = await authenticatedUser();
  if (!user) return error(401, "authentication_required", "Accedi per confermare un documento.");
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return error(400, "invalid_request", "Revisione non valida.");
  }
  const documentId = cleanText(body.documentId, 80);
  const action = body.action === "CONFIRM" || body.action === "REJECT" ? body.action : "";
  if (!documentId || !action) return error(400, "invalid_request", "Documento o azione non validi.");

  const category = GUIMMIA_DOCUMENT_CATEGORIES.includes(body.category as GuimmiaDocumentCategory)
    ? body.category as GuimmiaDocumentCategory
    : null;
  const folderCode = GUIMMIA_DOCUMENT_FOLDERS.includes(body.folderCode as GuimmiaDocumentFolder)
    ? body.folderCode as GuimmiaDocumentFolder
    : null;
  const recipientRoles = Array.isArray(body.recipientRoles)
    ? body.recipientRoles.filter((item): item is GuimmiaDocumentRecipient =>
        GUIMMIA_DOCUMENT_RECIPIENTS.includes(item as GuimmiaDocumentRecipient),
      ).slice(0, 5)
    : [];
  if (action === "CONFIRM" && (!category || !folderCode || recipientRoles.length === 0)) {
    return error(400, "invalid_request", "Controlla cartella e destinatari prima di confermare.");
  }

  try {
    const query = new URLSearchParams({ id: `eq.${documentId}`, user_id: `eq.${user.id}` });
    const rows = await rest<DocumentRow[]>(`guimmia_case_document_staging?${query}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(
        action === "CONFIRM"
          ? {
              category,
              folder_code: folderCode,
              recipient_roles: recipientRoles,
              status: "ARCHIVED",
              confirmed_at: new Date().toISOString(),
              confirmed_by: user.id,
              send_status: "NOT_SENT",
            }
          : { status: "REJECTED", confirmed_at: null, confirmed_by: user.id },
      ),
    });
    if (!rows[0]) return error(404, "document_not_found", "Documento non trovato.");
    return NextResponse.json<GuimmiaDocumentAnalysisSuccess>({
      ok: true,
      document: rowToDocument(rows[0]),
      assistantMessage:
        action === "CONFIRM"
          ? "Documento archiviato nella cartella logica scelta. Non è stato inviato a nessuno."
          : "Proposta rifiutata. Il documento non farà parte del fascicolo.",
      model: "gpt-5.6-luna",
      auditSaved: true,
      safety: { humanConfirmationRequired: true, legalValidityCertified: false, documentSent: false, privateStorage: true },
    });
  } catch {
    return error(503, "document_store_unavailable", "Non riesco ad aggiornare il documento.");
  }
}
