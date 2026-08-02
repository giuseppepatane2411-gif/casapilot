import { Suspense } from "react";

import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageFallback />}>
      <DashboardOverview />
    </Suspense>
  );
}

function DashboardPageFallback() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-20 animate-pulse rounded-[24px] bg-slate-200/70" />
      <div className="h-80 animate-pulse rounded-[30px] bg-slate-200/70" />
      <div className="h-20 animate-pulse rounded-[22px] bg-slate-100" />
    </div>
  );
}
