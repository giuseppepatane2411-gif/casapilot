import { redirect } from "next/navigation";

import {
  buildAuthPath,
  firstSearchParam,
  resolveAuthNextPath,
  type PageSearchParams,
} from "@/lib/navigation/auth-flow";

export default async function ProfessionalRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const source = await searchParams;
  const next = resolveAuthNextPath({
    next: firstSearchParam(source.next),
    message: firstSearchParam(source.message),
    intent: firstSearchParam(source.intent),
    brand: firstSearchParam(source.brand),
    accountType: "professional",
    fallback: "/professionista/onboarding",
  });

  redirect(buildAuthPath("/register", { accountType: "professional", next }));
}

