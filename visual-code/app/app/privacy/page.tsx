import type { Metadata } from "next";

import BetaPrivacy from "@/components/beta/BetaPrivacy";

export const metadata: Metadata = {
  title: "Privacy della beta",
  description: "Come CasaPilot Beta gestisce i dati locali.",
};

export default function PrivacyPage() {
  return <BetaPrivacy />;
}
