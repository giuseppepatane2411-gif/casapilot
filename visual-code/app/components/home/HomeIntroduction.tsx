import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  FileCheck2,
  MoreHorizontal,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const publicationChannels = ["Immobiliare.it", "idealista", "Casa.it"];

export default function HomeIntroduction() {
  return (
    <section className="relative overflow-hidden bg-white px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-10 lg:pb-24 lg:pt-20">
      <div className="pointer-events-none absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-24 h-[24rem] w-[24rem] rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(390px,0.78fr)] lg:gap-14 xl:gap-20">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-700 sm:text-sm">
              <Sparkles size={15} aria-hidden="true" />
              La tua guida immobiliare intelligente
            </p>
          </div>

          <h1 className="mt-7 max-w-4xl tracking-[-0.05em] text-slate-950">
            <span className="block text-[42px] font-black leading-[0.98] sm:text-6xl lg:text-[64px]">
              L’agenzia immobiliare digitale
            </span>
            <span className="mt-3 block text-[27px] font-extrabold leading-tight tracking-[-0.035em] text-slate-700 sm:text-4xl lg:text-[39px]">
              che rende più semplice
            </span>
            <span className="mt-1 block text-[39px] font-black leading-[1.02] sm:text-5xl lg:text-[55px]">
              comprare, vendere e affittare casa.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-base font-semibold leading-8 text-slate-600 sm:text-lg sm:leading-9">
            Tu gestisci direttamente appuntamenti e visite. Guimmia prepara e
            mantiene ordinati{" "}
            <strong className="font-black text-slate-950">
              annuncio, documenti, negoziazione e contratto
            </strong>
            , con agenti e professionisti quando servono competenza e
            responsabilità.
          </p>

          <div className="mt-7 grid max-w-2xl gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3">
            {["Un unico percorso", "Meno passaggi inutili", "Decisioni sotto il tuo controllo"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {item}
                </span>
              ),
            )}
          </div>

          <Link
            href="#come-funziona"
            className="mt-9 inline-flex items-center gap-2 text-sm font-black text-blue-700 transition hover:gap-3 hover:text-blue-900"
          >
            Guarda come funziona <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <aside className="relative mx-auto w-full max-w-[490px] py-4 sm:py-7">
          <div className="pointer-events-none absolute inset-x-10 bottom-4 h-24 rounded-full bg-blue-500/30 blur-3xl" />

          <div className="relative overflow-hidden rounded-[38px] border-[9px] border-slate-950 bg-slate-950 shadow-[0_34px_90px_rgba(15,23,42,0.28)]">
            <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />

            <div className="relative overflow-hidden rounded-[28px] bg-slate-50">
              <div className="flex items-center justify-between bg-white px-5 pb-2 pt-3 text-[10px] font-black text-slate-700">
                <span>9:41</span>
                <span className="flex items-center gap-1.5">
                  <span>5G</span>
                  <span className="h-2.5 w-5 rounded-[3px] border border-slate-400 p-0.5">
                    <span className="block h-full w-3 rounded-[1px] bg-emerald-500" />
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 pb-3 pt-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                    <Bot size={20} aria-hidden="true" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      Guimmia
                    </p>
                    <p className="truncate text-[10px] font-bold text-slate-500">
                      Pratica vendita · Bologna
                    </p>
                  </div>
                </div>
                <MoreHorizontal size={20} className="text-slate-400" aria-hidden="true" />
              </div>

              <div className="space-y-3 px-3.5 py-4 sm:px-4">
                <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2.5 text-xs font-semibold leading-5 text-white">
                  Vorrei vendere il mio trilocale a Bologna. Da dove cominciamo?
                </div>

                <div className="flex max-w-[94%] items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Sparkles size={14} aria-hidden="true" />
                  </span>
                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold leading-5 text-slate-700 shadow-sm">
                    Partiamo dai documenti. Li controllo e preparo con l’agenzia
                    la scheda del tuo immobile.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <FileCheck2 size={17} aria-hidden="true" />
                      </span>
                      <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
                    </div>
                    <p className="mt-2 truncate text-[11px] font-black text-slate-900">
                      Visura catastale.pdf
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                      Verificata
                    </p>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <FileCheck2 size={17} aria-hidden="true" />
                      </span>
                      <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
                    </div>
                    <p className="mt-2 truncate text-[11px] font-black text-slate-900">
                      Planimetria.pdf
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                      Ricevuta
                    </p>
                  </article>
                </div>

                <article className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_12px_35px_rgba(37,99,235,0.1)]">
                  <div className="grid grid-cols-[105px_1fr]">
                    <div className="relative min-h-[104px] overflow-hidden bg-slate-200">
                      <Image
                        src="/images/guimmia/home-hero-agency.webp"
                        alt="Anteprima dell’annuncio immobiliare preparato da Guimmia"
                        fill
                        sizes="105px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 p-3">
                      <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700">
                        <ShieldCheck size={13} aria-hidden="true" />
                        Annuncio pronto
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-xs font-black leading-4 text-slate-950">
                        Trilocale luminoso · Bologna, Saragozza
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">
                        Foto, descrizione e dati ordinati
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                        Pubblicazione coordinata
                      </p>
                      <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {publicationChannels.map((channel) => (
                        <span
                          key={channel}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-800"
                        >
                          <Check size={10} strokeWidth={3} aria-hidden="true" />
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>

                <form
                  action="/guimmia"
                  className="flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-3 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50"
                >
                  <Paperclip size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
                  <label htmlFor="home-guimmia-message" className="sr-only">
                    Scrivi a Guimmia
                  </label>
                  <input
                    id="home-guimmia-message"
                    name="message"
                    required
                    placeholder="Scrivi o allega un documento…"
                    className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    aria-label="Invia il messaggio a Guimmia"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
                  >
                    <Send size={16} aria-hidden="true" />
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-3 text-center text-[10px] font-bold text-slate-500">
                Guimmia prepara e propone. Tu controlli e decidi.
              </div>
            </div>
          </div>

          <div className="absolute -left-8 top-[42%] hidden items-center gap-2 rounded-2xl border border-white bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-950/10 backdrop-blur xl:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FileCheck2 size={16} aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-[11px] font-black text-slate-950">
                Documenti verificati
              </strong>
              <span className="block text-[9px] font-bold text-slate-500">
                Pratica aggiornata
              </span>
            </span>
          </div>

          <div className="absolute -right-7 bottom-20 hidden items-center gap-2 rounded-2xl border border-blue-100 bg-white/95 px-3 py-2.5 shadow-xl shadow-blue-950/10 backdrop-blur xl:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <CheckCircle2 size={17} aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-[11px] font-black text-slate-950">
                Annuncio pronto
              </strong>
              <span className="block text-[9px] font-bold text-slate-500">
                Canali coordinati
              </span>
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
