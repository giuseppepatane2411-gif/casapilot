import Link from "next/link";

export default function ProfessionalNav() {
  const items = [
    ["Servizi", "/dashboard/professionals"],
    ["Le mie richieste", "/dashboard/professionals/requests"],
    ["Preferenze", "/dashboard/settings/communication"],
  ];

  return (
    <nav className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
      {items.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
