import { PROPERTY_GLOSSARY } from "@/lib/remote-layer/glossary";
import { LANGUAGE_LABELS } from "@/lib/remote-layer/labels";
import type { LanguageCode } from "@/lib/remote-layer/types";

export default function GlossaryCard({
  language,
  entryIds,
}: {
  language: LanguageCode;
  entryIds: string[];
}) {
  const entries = PROPERTY_GLOSSARY.filter((entry) =>
    entryIds.includes(entry.id),
  );
  if (entries.length === 0) return null;

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
        Spiegazione di Guimmia · {LANGUAGE_LABELS[language]}
      </p>
      <div className="mt-4 space-y-4">
        {entries.map((entry) => (
          <article key={entry.id}>
            <h3 className="font-semibold text-blue-950">
              {entry.translations[language]}
              {language !== "it" ? (
                <span className="ml-2 text-xs font-normal text-blue-700">
                  ({entry.italianTerm})
                </span>
              ) : null}
            </h3>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              {entry.explanations[language]}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-blue-700">
        Le spiegazioni e le traduzioni automatiche sono informative. Per atti o
        procedure che richiedono una traduzione certificata serve un professionista
        abilitato.
      </p>
    </section>
  );
}

