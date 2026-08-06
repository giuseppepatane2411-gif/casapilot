import { NextResponse } from "next/server";
import { applyTranslationPolicy, classifyContentSensitivity } from "@/lib/remote-layer/policy";
import { translateLocally } from "@/lib/remote-layer/translation";
import type {
  CommunicationPreference,
  ContentSensitivity,
  LanguageCode,
  TranslationResult,
} from "@/lib/remote-layer/types";

interface TranslationRequest {
  originalText?: string;
  sourceLanguage?: LanguageCode;
  targetLanguage?: LanguageCode;
  contentSensitivity?: ContentSensitivity;
  communicationPreference?: CommunicationPreference;
  context?: "chat" | "quote" | "technical_note" | "document";
}

const MAX_LENGTH = 6000;

export async function POST(request: Request) {
  let body: TranslationRequest;
  try {
    body = (await request.json()) as TranslationRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const originalText = body.originalText?.trim();
  const sourceLanguage = body.sourceLanguage;
  const targetLanguage = body.targetLanguage;
  const preference = body.communicationPreference ?? "automatic";

  if (!originalText || !sourceLanguage || !targetLanguage) {
    return NextResponse.json(
      { error: "Invalid translation request" },
      { status: 400 },
    );
  }

  if (originalText.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Text exceeds ${MAX_LENGTH} characters` },
      { status: 413 },
    );
  }

  const sensitivity =
    body.contentSensitivity ?? classifyContentSensitivity(originalText);
  const local = translateLocally(
    originalText,
    sourceLanguage,
    targetLanguage,
    preference,
  );

  if (
    local.status !== "provider_required" ||
    sensitivity === "official_document"
  ) {
    return NextResponse.json(local);
  }

  const endpoint = process.env.CASAPILOT_TRANSLATION_ENDPOINT;
  if (!endpoint) return NextResponse.json(local);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.CASAPILOT_TRANSLATION_TOKEN
          ? {
              authorization: `Bearer ${process.env.CASAPILOT_TRANSLATION_TOKEN}`,
            }
          : {}),
      },
      body: JSON.stringify({
        text: originalText,
        sourceLanguage,
        targetLanguage,
        sensitivity,
        context: body.context ?? "chat",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) return NextResponse.json(local);

    const payload = (await response.json()) as {
      translatedText?: string;
      quality?: "low" | "medium" | "high";
      providerReference?: string;
    };

    if (!payload.translatedText?.trim()) {
      return NextResponse.json(local);
    }

    const translated: TranslationResult = applyTranslationPolicy(
      {
        sourceLanguage,
        targetLanguage,
        originalText,
        translatedText: payload.translatedText.trim(),
        status: "translated",
        method: "provider",
        quality: payload.quality ?? "unknown",
        contentSensitivity: sensitivity,
        glossaryReferences: local.glossaryReferences ?? [],
      },
      preference,
    );

    return NextResponse.json(translated);
  } catch {
    return NextResponse.json(local);
  }
}
