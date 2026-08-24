export default function ListingFilters({
  values,
}: {
  values: Record<string, string>;
}) {
  return (
    <form action="/immobili" className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,.08)] lg:grid-cols-6">
      <select name="operazione" defaultValue={values.operazione ?? ""} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blue-600">
        <option value="">Vendita + affitto</option>
        <option value="sale">Vendita</option>
        <option value="rent">Affitto</option>
      </select>
      <input name="citta" defaultValue={values.citta ?? ""} placeholder="Città" className="h-12 rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-blue-600" />
      <select name="tipologia" defaultValue={values.tipologia ?? ""} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blue-600">
        <option value="">Tipologia</option>
        <option>Appartamento</option>
        <option>Attico</option>
        <option>Villa</option>
        <option>Casa indipendente</option>
        <option>Terreno</option>
        <option>Locale commerciale</option>
      </select>
      <input type="number" min="0" name="min" defaultValue={values.min ?? ""} placeholder="Prezzo min." className="h-12 rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-blue-600" />
      <input type="number" min="0" name="max" defaultValue={values.max ?? ""} placeholder="Prezzo max." className="h-12 rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-blue-600" />
      <div className="flex gap-2">
        <select name="locali" defaultValue={values.locali ?? ""} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blue-600">
          <option value="">Locali</option>
          <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option>
          <option value="4">4+</option><option value="5">5+</option>
        </select>
        <button className="rounded-2xl bg-blue-600 px-5 font-black text-white hover:bg-blue-700">Cerca</button>
      </div>
    </form>
  );
}
