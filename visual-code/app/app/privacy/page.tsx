import type { Metadata } from "next";

import PrivacyOverview from "@/components/privacy/PrivacyOverview";

export const metadata: Metadata = {
  title: "Privacy e dati",
  description: "Come CasaPilot gestisce account, pratiche e documenti.",
};

export default function PrivacyPage() {
  return <PrivacyOverview />;
}
