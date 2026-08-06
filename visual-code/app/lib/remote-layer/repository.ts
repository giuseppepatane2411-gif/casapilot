import { redactContactData } from "@/lib/professionals/engine";
import { classifyContentSensitivity } from "./policy";
import { detectLanguage, translateLocally } from "./translation";
import type {
  CommunicationPreference,
  LanguageCode,
  OwnerRemotePreferences,
  RemoteMessage,
  TranslationResult,
} from "./types";

const PREFERENCES_KEY = "casapilot_v72_owner_communication_preferences";
const LEGACY_PREFERENCES_KEY = "casapilot_v71_owner_remote_preferences";
const MESSAGES_KEY = "casapilot_v72_multilingual_messages";
const LEGACY_MESSAGES_KEY = "casapilot_v71_remote_messages";
const TRANSLATION_CACHE_KEY = "casapilot_v72_translation_cache";

const now = () => new Date().toISOString();
const id = (prefix: string) =>
  `${prefix}_${
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  }`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function simpleHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function defaultOwnerRemotePreferences(): OwnerRemotePreferences {
  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome"
      : "Europe/Rome";

  return {
    preferredLanguage: "it",
    countryOfResidence: "Italia",
    timezone,
    presenceAvailability: "available",
    specificPresenceDates: "",
    localContactAvailable: false,
    localContactRole: "",
    translationEnabled: false,
    translationConsent: false,
    communicationPreference: "automatic",
    showOriginalByDefault: true,
    videoCallPreferred: false,
    preferredContactWindows: [],
    updatedAt: now(),
  };
}

function normalizePreferences(
  value: Partial<OwnerRemotePreferences> | null,
): OwnerRemotePreferences {
  const defaults = defaultOwnerRemotePreferences();
  return {
    ...defaults,
    ...value,
    communicationPreference:
      value?.communicationPreference ??
      (value?.translationEnabled ? "translation_allowed" : "automatic"),
    translationConsent:
      value?.translationConsent ?? Boolean(value?.translationEnabled),
    showOriginalByDefault: value?.showOriginalByDefault ?? true,
    preferredContactWindows: value?.preferredContactWindows ?? [],
    updatedAt: value?.updatedAt ?? now(),
  };
}

export function getOwnerRemotePreferences() {
  const current = read<OwnerRemotePreferences | null>(PREFERENCES_KEY, null);
  if (current) return normalizePreferences(current);

  const legacy = read<OwnerRemotePreferences | null>(
    LEGACY_PREFERENCES_KEY,
    null,
  );
  const migrated = normalizePreferences(legacy);
  write(PREFERENCES_KEY, migrated);
  return migrated;
}

export function saveOwnerRemotePreferences(
  input: Omit<OwnerRemotePreferences, "updatedAt">,
) {
  const value: OwnerRemotePreferences = {
    ...normalizePreferences(input),
    updatedAt: now(),
  };
  write(PREFERENCES_KEY, value);
  return value;
}

export function getAllRemoteMessages() {
  const current = read<RemoteMessage[] | null>(MESSAGES_KEY, null);
  if (current) return current;

  const legacy = read<RemoteMessage[]>(LEGACY_MESSAGES_KEY, []).map(
    (message) => ({
      ...message,
      contentSensitivity:
        message.contentSensitivity ??
        classifyContentSensitivity(message.originalText),
      translationMethod:
        message.translationMethod ??
        (message.translationStatus === "same_language"
          ? "same_language"
          : message.translatedText
            ? "local_glossary"
            : "none"),
      translationQuality: message.translationQuality ?? "unknown",
      reviewRequired: message.reviewRequired ?? false,
      glossaryReferences: message.glossaryReferences ?? [],
    }),
  );
  write(MESSAGES_KEY, legacy);
  return legacy;
}

export function getRemoteMessages(leadId: string) {
  return getAllRemoteMessages().filter(
    (message) => message.leadId === leadId,
  );
}

export function cacheTranslation(result: TranslationResult) {
  const key = simpleHash(
    `${result.sourceLanguage}:${result.targetLanguage}:${result.originalText}`,
  );
  const cache = read<Record<string, TranslationResult>>(
    TRANSLATION_CACHE_KEY,
    {},
  );
  write(TRANSLATION_CACHE_KEY, { ...cache, [key]: result });
}

export function getCachedTranslation({
  originalText,
  sourceLanguage,
  targetLanguage,
}: {
  originalText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}) {
  const key = simpleHash(
    `${sourceLanguage}:${targetLanguage}:${originalText}`,
  );
  return read<Record<string, TranslationResult>>(
    TRANSLATION_CACHE_KEY,
    {},
  )[key];
}

export function sendRemoteMessage({
  leadId,
  senderRole,
  senderId,
  text,
  senderLanguage,
  targetLanguage,
  contactsUnlocked = false,
  communicationPreference = "automatic",
}: {
  leadId: string;
  senderRole: RemoteMessage["senderRole"];
  senderId: string;
  text: string;
  senderLanguage?: LanguageCode;
  targetLanguage: LanguageCode;
  contactsUnlocked?: boolean;
  communicationPreference?: CommunicationPreference;
}) {
  const protectedContent = contactsUnlocked
    ? { body: text, redacted: false }
    : redactContactData(text);
  const sourceLanguage =
    senderLanguage ?? detectLanguage(protectedContent.body);

  const cached = getCachedTranslation({
    originalText: protectedContent.body,
    sourceLanguage,
    targetLanguage,
  });
  const translation =
    cached ??
    translateLocally(
      protectedContent.body,
      sourceLanguage,
      targetLanguage,
      communicationPreference,
    );

  cacheTranslation(translation);

  const message: RemoteMessage = {
    id: id("remote_message"),
    leadId,
    senderRole,
    senderId,
    originalLanguage: sourceLanguage,
    originalText: protectedContent.body,
    translatedLanguage: targetLanguage,
    translatedText: translation.translatedText,
    translationStatus: translation.status,
    translationMethod: translation.method,
    translationQuality: translation.quality,
    contentSensitivity: translation.contentSensitivity,
    reviewRequired: translation.reviewRequired,
    glossaryReferences: translation.glossaryReferences,
    contactDataProtected: protectedContent.redacted,
    createdAt: now(),
  };

  write(MESSAGES_KEY, [...getAllRemoteMessages(), message]);
  return message;
}

export function updateRemoteMessage(
  messageId: string,
  patch: Partial<RemoteMessage>,
) {
  const values = getAllRemoteMessages().map((message) =>
    message.id === messageId ? { ...message, ...patch } : message,
  );
  write(MESSAGES_KEY, values);
  return values.find((message) => message.id === messageId);
}

export function approveMessageTranslation(
  messageId: string,
  reviewer = "current-user",
) {
  return updateRemoteMessage(messageId, {
    translationStatus: "approved",
    reviewRequired: false,
    reviewedAt: now(),
    reviewedBy: reviewer,
  });
}
