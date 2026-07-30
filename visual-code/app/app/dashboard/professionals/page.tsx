import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  FileSignature,
  Hammer,
  Ruler,
  Scale,
  Users,
} from "lucide-react";

const categories = [
  {
    title: "Geometra",
    description: "Verifiche catastali, urbanistiche e rilievi.",
    icon: Ruler,
  },
  {
    title: "Notaio",
    description: "Atti, provenienza e passaggi della compravendita.",
    icon: FileSignature,
  },
  {
    title: "Tecnico certificatore",
    description: "APE e documentazione energetica.",
    icon: Calculator,
  },
  {
    title: "Avvocato",
    description: "Contratti, locazioni e situazioni complesse.",
    icon: Scale,
  },
  {
    title: "Impresa",
    description: "Interventi, manutenzioni e adeguamenti.",
    icon: Hammer,
  },
];

export default function ProfessionalsPage() {
  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-blue-600">Rete CasaPilot</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">
          Professionisti
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Le categorie che Pilot potrà suggerire in base alle necessità della tua pratica.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-[30px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold">
              <BadgeCheck size={14} />
              Marketplace in sviluppo
            </span>
            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
              Il professionista giusto, nel momento giusto.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              La struttura è pronta per collegare ogni missione a esperti verificati. Le richieste e i preventivi saranno aggiunti in uno sprint dedicato.
            </p>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-blue-300">
            <Users size={28} />
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <article
              key={category.title}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon size={20} />
              </span>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{category.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-400">
                Disponibile prossimamente
                <ArrowRight size={15} />
              </span>
            </article>
          );
        })}
      </section>
    </div>
  );
}
