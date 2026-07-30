import type { Metadata } from "next";
import { Suspense } from "react";

import LocalDocumentVault from "@/components/local-vault/LocalDocumentVault";

export const metadata: Metadata = {
  title: "Archivio locale",
  description: "Collega documenti alla pratica senza inviarli a server esterni.",
};

export default function LocalVaultPage() {
  return (
    <Suspense fallback={<div className="h-[650px] animate-pulse rounded-[32px] bg-slate-100" />}>
      <LocalDocumentVault />
    </Suspense>
  );
}
