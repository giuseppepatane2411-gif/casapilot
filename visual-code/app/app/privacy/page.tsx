import PrivacyOverview from "@/components/privacy/PrivacyOverview";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Privacy e dati",
  description: "Come Guimmia gestisce account, pratiche e documenti.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <PrivacyOverview />;
}
