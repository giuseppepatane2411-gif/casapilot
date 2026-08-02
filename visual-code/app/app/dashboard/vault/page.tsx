import type { Metadata } from "next";
import { Suspense } from "react";

import LocalDocumentVault from "@/components/local-vault/LocalDocumentVault";

export const metadata: Metadata = {
  title: "I miei file",
  description: "Salva i file dell’immobile sul dispositivo e collegali alla checklist.",
};

export default function LocalVaultPage() {
  return (
    <Suspense fallback={<div className="h-[650px] animate-pulse rounded-[32px] bg-slate-100" />}>
      <LocalDocumentVault />
    </Suspense>
  );
}
