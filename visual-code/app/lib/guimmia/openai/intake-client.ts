import type {
  GuimmiaIntakeError,
  GuimmiaIntakeRequest,
  GuimmiaIntakeSuccess,
} from "@/lib/guimmia/openai/intake-types";

export class GuimmiaIntakeRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: GuimmiaIntakeError["error"] | "unknown",
  ) {
    super(message);
  }
}

export async function requestGuimmiaIntake(
  request: GuimmiaIntakeRequest,
): Promise<GuimmiaIntakeSuccess> {
  const response = await fetch("/api/guimmia/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });
  const payload = (await response.json()) as
    | GuimmiaIntakeSuccess
    | GuimmiaIntakeError;
  if (!payload.ok) {
    throw new GuimmiaIntakeRequestError(
      payload.message || "Guimmia non è riuscita a leggere il messaggio.",
      response.status,
      payload.error || "unknown",
    );
  }
  if (!response.ok) {
    throw new GuimmiaIntakeRequestError(
      "Guimmia non è riuscita a leggere il messaggio.",
      response.status,
      "unknown",
    );
  }
  return payload;
}
