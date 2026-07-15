import {
  Brain,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Tu parli con Pilot",
    description:
      "Spiega semplicemente cosa vuoi fare con il tuo immobile.",
  },
  {
    icon: Brain,
    title: "Pilot analizza",
    description:
      "L'assistente comprende la tua situazione e costruisce il percorso migliore.",
  },
  {
    icon: FileText,
    title: "Fascicolo automatico",
    description:
      "CasaPilot crea automaticamente il fascicolo del tuo immobile.",
  },
  {
    icon: Users,
    title: "Professionisti",
    description:
      "Quando serve, trovi i professionisti migliori già verificati.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-32">

      <div className="mx-auto max-w-6xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <h2 className="text-5xl font-bold tracking-tight text-slate-900">

            Pilot lavora al posto tuo

          </h2>

          <p className="mt-6 text-xl leading-9 text-slate-500">

            Da una semplice conversazione nasce tutto il percorso per
            vendere o affittare il tuo immobile.

          </p>

        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-2">

          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">

                  <Icon
                    size={28}
                    className="text-slate-900"
                  />

                </div>

                <h3 className="text-2xl font-semibold">

                  {step.title}

                </h3>

                <p className="mt-4 leading-8 text-slate-500">

                  {step.description}

                </p>

              </div>
            );
          })}

        </div>

      </div>

    </section>
  );
}