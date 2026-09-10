import Link from "next/link";

import {
  buildAuthPath,
  firstSearchParam,
  resolveAuthNextPath,
  type PageSearchParams,
} from "@/lib/navigation/auth-flow";

export default async function RegistrationGatewayPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const source = await searchParams;
  const context = {
    next: firstSearchParam(source.next),
    goal: firstSearchParam(source.goal),
    message: firstSearchParam(source.message),
    intent: firstSearchParam(source.intent),
    brand: firstSearchParam(source.brand),
  };
  const ownerNext = resolveAuthNextPath({
    ...context,
    accountType: "private",
    fallback: "/dashboard/properties/new",
  });
  const professionalNext = resolveAuthNextPath({
    ...context,
    accountType: "professional",
    fallback: "/professionista/onboarding",
  });
  const ownerHref = buildAuthPath("/register", {
    accountType: "private",
    next: ownerNext,
  });
  const professionalHref = buildAuthPath("/register", {
    accountType: "professional",
    next: professionalNext,
  });
  const hasReturnContext = Boolean(
    context.next || context.goal || context.message || context.intent || context.brand,
  );
  const loginHref = buildAuthPath("/login", {
    next: hasReturnContext ? ownerNext : null,
  });

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Crea il tuo account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Scegli lo spazio corretto per te</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">Proprietari e professionisti seguono percorsi separati, con dati e funzioni coerenti con il proprio ruolo.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link href={ownerHref} className="group rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">🏠</span>
            <h2 className="mt-6 text-2xl font-semibold">Sono proprietario o rappresento la proprietà</h2>
            <p className="mt-3 leading-7 text-slate-600">Per persone fisiche, società, holding, enti e altri soggetti intestatari o delegati alla gestione dell’immobile.</p>
            <span className="mt-7 inline-flex font-semibold text-emerald-700">Registrazione proprietario →</span>
          </Link>

          <Link href={professionalHref} className="group rounded-3xl border border-blue-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">💼</span>
            <h2 className="mt-6 text-2xl font-semibold">Sono un professionista o rappresento un’attività</h2>
            <p className="mt-3 leading-7 text-slate-600">Per liberi professionisti, studi, agenzie, imprese e società che offrono servizi immobiliari.</p>
            <span className="mt-7 inline-flex font-semibold text-blue-700">Registrazione professionista →</span>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">Hai già un account? <Link href={loginHref} className="font-semibold text-blue-600">Accedi</Link></p>
      </div>
    </main>
  );
}
