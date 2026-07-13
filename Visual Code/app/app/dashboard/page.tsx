import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import PilotCard from "@/components/dashboard/PilotCard";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-100">

      <Sidebar />

      <main className="flex-1">

        <Header />

        <div className="space-y-8 p-8">

          <PilotCard />

          <div className="grid gap-6 lg:grid-cols-3">

            <div className="rounded-3xl bg-white p-8 shadow-sm">

              <h2 className="text-xl font-bold">
                🏠 Le mie proprietà
              </h2>

              <p className="mt-4 text-slate-500">
                Non hai ancora creato nessun immobile.
              </p>

              <button className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-white">
                + Nuova proprietà
              </button>

            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">

              <h2 className="text-xl font-bold">
                ⭐ CasaPilot Score
              </h2>

              <div className="mt-6 text-6xl font-extrabold text-blue-600">
                --
              </div>

              <p className="mt-3 text-slate-500">
                Crea il tuo primo immobile per ottenere il punteggio.
              </p>

            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">

              <h2 className="text-xl font-bold">
                📅 Attività
              </h2>

              <ul className="mt-5 space-y-3 text-slate-600">

                <li>• Nessuna attività in programma</li>

                <li>• Nessuna scadenza</li>

                <li>• Nessun promemoria</li>

              </ul>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}