import type {
  SiteOrchestrationError,
  SiteOrchestrationRequest,
  SiteOrchestrationResponse,
} from "@/lib/guimmia/site-orchestration/types";

export async function requestSiteOrchestration(
  input: SiteOrchestrationRequest,
): Promise<SiteOrchestrationResponse> {
  const response = await fetch("/api/guimmia/orchestrate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const payload = (await response.json()) as
    | SiteOrchestrationResponse
    | SiteOrchestrationError;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "orchestration_failed" : payload.error);
  }

  return payload;
}
