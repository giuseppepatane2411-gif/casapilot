import type {
  GuimmiaDocumentAnalysisSuccess,
  GuimmiaDocumentCategory,
  GuimmiaDocumentError,
  GuimmiaDocumentFolder,
  GuimmiaDocumentListSuccess,
  GuimmiaDocumentRecipient,
} from "@/lib/guimmia/operations/document-types";

async function payload<T>(response: Response) {
  const value = (await response.json()) as T | GuimmiaDocumentError;
  if (!response.ok || !(value as { ok?: boolean }).ok) {
    throw new Error(
      (value as GuimmiaDocumentError).message ||
        "Guimmia non è riuscita a gestire il documento.",
    );
  }
  return value as T;
}

export async function listGuimmiaDocuments(draftId: string) {
  const response = await fetch(
    `/api/guimmia/documents?draftId=${encodeURIComponent(draftId)}`,
    { cache: "no-store" },
  );
  return payload<GuimmiaDocumentListSuccess>(response);
}

export async function analyzeGuimmiaDocument(
  file: File,
  draftId: string,
) {
  const form = new FormData();
  form.set("file", file);
  form.set("draftId", draftId);
  const response = await fetch("/api/guimmia/documents", {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  return payload<GuimmiaDocumentAnalysisSuccess>(response);
}

export async function reviewGuimmiaDocument(input: {
  documentId: string;
  action: "CONFIRM" | "REJECT";
  category?: GuimmiaDocumentCategory;
  folderCode?: GuimmiaDocumentFolder;
  recipientRoles?: GuimmiaDocumentRecipient[];
}) {
  const response = await fetch("/api/guimmia/documents", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return payload<GuimmiaDocumentAnalysisSuccess>(response);
}
