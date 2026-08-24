import "server-only";

const OPENAI_PLACEHOLDERS = new Set([
  "",
  "sk-your-openai-api-key",
  "your-openai-api-key",
]);

export const GUIMMIA_OPENAI_MODEL = "gpt-5.6-luna" as const;
export const GUIMMIA_AI_MODE = "DRY_RUN" as const;
export const GUIMMIA_AI_MONTHLY_BUDGET_USD = 5;
export const GUIMMIA_AI_MAX_REQUEST_COST_USD = 0.05;
export const GUIMMIA_AI_RATE_LIMIT_REQUESTS = 3;
export const GUIMMIA_AI_RATE_LIMIT_WINDOW_MINUTES = 30;

export function getOpenAIConfiguration() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";

  return {
    apiKey,
    model: GUIMMIA_OPENAI_MODEL,
    mode: GUIMMIA_AI_MODE,
    monthlyBudgetUsd: GUIMMIA_AI_MONTHLY_BUDGET_USD,
    maxRequestCostUsd: GUIMMIA_AI_MAX_REQUEST_COST_USD,
    rateLimitRequests: GUIMMIA_AI_RATE_LIMIT_REQUESTS,
    rateLimitWindowMinutes: GUIMMIA_AI_RATE_LIMIT_WINDOW_MINUTES,
    configured: Boolean(apiKey) && !OPENAI_PLACEHOLDERS.has(apiKey),
  };
}
