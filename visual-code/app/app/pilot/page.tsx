import { redirect } from "next/navigation";

import {
  buildPathWithSearchParams,
  type PageSearchParams,
} from "@/lib/navigation/auth-flow";

export default async function PilotPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  redirect(buildPathWithSearchParams("/dashboard/pilot", await searchParams));
}

