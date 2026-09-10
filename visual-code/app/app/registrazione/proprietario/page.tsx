import { redirect } from "next/navigation";

import {
  buildAuthPath,
  firstSearchParam,
  resolveAuthNextPath,
  type PageSearchParams,
} from "@/lib/navigation/auth-flow";

export default async function OwnerRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const source = await searchParams;
  const next = resolveAuthNextPath({
    next: firstSearchParam(source.next),
    goal: firstSearchParam(source.goal),
    message: firstSearchParam(source.message),
    intent: firstSearchParam(source.intent),
    brand: firstSearchParam(source.brand),
    accountType: "private",
    fallback: "/dashboard/properties/new",
  });

  redirect(buildAuthPath("/register", { accountType: "private", next }));
}

