export default function Features() {
  const features = [
    {
      title: "Vendi",
      description:
        "Pilot ti guida dalla preparazione dei documenti fino al rogito.",
      icon: "🏠",
    },
    {
      title: "Affitta",
      description:
        "Gestisci contratti, documenti e ricerca dell'inquilino ideale.",
      icon: "🔑",
    },
    {
      title: "Acquista",
      description:
        "Organizza ogni fase dell'acquisto senza dimenticare nulla.",
      icon: "📝",
    },
    {
      title: "Professionisti",
      description:
        "Trova agenti immobiliari, geometri, notai, imprese e tecnici verificati.",
      icon: "👨‍💼",
    },
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">

          <h2 className="text-4xl font-bold text-slate-900">
            Un unico assistente.
            <br />
            Tutto il mondo immobiliare.
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            CasaPilot non è solo un archivio documentale.
            È l’assistente immobiliare digitale che accompagna utenti,
            proprietari, inquilini e professionisti in ogni pratica.
          </p>

        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {features.map((feature) => (

            <div
              key={feature.title}
              className="rounded-3xl border border-slate-200 p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="text-5xl">
                {feature.icon}
              </div>

              <h3 className="mt-6 text-2xl font-bold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {feature.description}
              </p>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}