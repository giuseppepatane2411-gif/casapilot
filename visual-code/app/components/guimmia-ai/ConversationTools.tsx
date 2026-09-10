"use client";

import { useRef, useState } from "react";
import { Check, Download, FolderPen, LoaderCircle, X } from "lucide-react";
import { conversationText, downloadText, exportFileName } from "@/lib/guimmia-ai/answer-content";
import type { GuimmiaAIConversation, GuimmiaAIMessage, GuimmiaAIProject } from "@/lib/guimmia-ai/types";

type Props = {
  conversation: GuimmiaAIConversation;
  projects: GuimmiaAIProject[];
  messages: GuimmiaAIMessage[];
  busy: boolean;
  pendingMessageId?: string;
  onSave: (title: string, projectId: string | null) => Promise<boolean>;
};

export default function ConversationTools({ conversation, projects, messages, busy, pendingMessageId, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [projectId, setProjectId] = useState(conversation.project_id || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const saveLock = useRef(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveLock.current || busy || !title.trim()) return;
    saveLock.current = true;
    setSaving(true);
    setStatus("");
    try {
      if (await onSave(title, projectId || null)) {
        setEditing(false);
        setStatus("Nome e cartella salvati.");
      } else setStatus("Modifica non confermata. Il testo resta qui: puoi riprovare.");
    } catch { setStatus("Modifica non confermata. Controlla la connessione e riprova."); }
    finally { setSaving(false); saveLock.current = false; }
  }

  function download() {
    try {
      downloadText(conversationText(conversation, messages, pendingMessageId), exportFileName(conversation.title));
      setStatus("Download della conversazione avviato (.txt).");
    } catch { setStatus("Download non riuscito. Puoi copiare le singole risposte."); }
  }

  return (
    <section aria-label="Gestisci conversazione" className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" data-guimmia-action disabled={busy || saving} onClick={() => { setTitle(conversation.title); setProjectId(conversation.project_id || ""); setEditing(!editing); setStatus(""); }} aria-expanded={editing} aria-controls="conversation-settings" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 disabled:opacity-50">
          <FolderPen size={16} /> Nome e cartella
        </button>
        <button type="button" data-guimmia-action disabled={busy || messages.length === 0} onClick={download} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
          <Download size={16} /> Esporta chat
        </button>
        <span className="ml-auto max-w-full truncate px-3 text-sm text-slate-500">{projects.find((item) => item.id === conversation.project_id)?.name || "Senza cartella"}</span>
      </div>
      {editing ? (
        <form id="conversation-settings" onSubmit={(event) => void save(event)} className="mt-3 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Nome della chat
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required disabled={saving || busy} className="min-h-11 min-w-0 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Cartella
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={saving || busy} className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-500">
              <option value="">Senza cartella</option>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" data-guimmia-action disabled={saving || busy || !title.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} {saving ? "Salvataggio…" : "Salva"}</button>
            <button type="button" disabled={saving} onClick={() => setEditing(false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm text-slate-500"><X size={15} /> Annulla</button>
          </div>
        </form>
      ) : null}
      {status ? <p role="status" className="mt-2 px-3 text-sm leading-5 text-slate-500">{status}</p> : null}
    </section>
  );
}
