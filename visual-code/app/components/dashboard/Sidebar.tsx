import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-slate-200 bg-white p-6">

      <h1 className="text-3xl font-extrabold">
        Casa<span className="text-blue-600">ia</span>
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Il tuo assistente immobiliare
      </p>

      <nav className="mt-10 space-y-3">

        <Link
          href="/dashboard"
          className="block rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard/sell"
          className="block rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100"
        >
          Vendi un immobile
        </Link>

        <Link
          href="/"
          className="block rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100"
        >
          Torna alla Home
        </Link>

      </nav>

    </aside>
  );
}