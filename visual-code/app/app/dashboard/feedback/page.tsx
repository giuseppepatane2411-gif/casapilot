import type { Metadata } from "next";

import BetaFeedbackForm from "@/components/beta/BetaFeedbackForm";
import BetaFeedbackInsights from "@/components/beta/BetaFeedbackInsights";

export const metadata: Metadata = {
  title: "Feedback beta",
  description: "Condividi e analizza il feedback sulla beta di CasaPilot.",
};

export default function FeedbackPage() {
  return (
    <div className="space-y-8">
      <BetaFeedbackForm />
      <BetaFeedbackInsights />
    </div>
  );
}
