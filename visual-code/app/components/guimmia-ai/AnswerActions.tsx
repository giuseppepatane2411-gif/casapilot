"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { answerMetadata, answerText, downloadText, exportFileName } from "@/lib/guimmia-ai/answer-content";
import type { GuimmiaAIMessage } from "@/lib/guimmia-ai/types";

export default function AnswerActions({ message, notSaved = false }: { message: GuimmiaAIMessage; notSaved?: boolean }) {
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState(false);

  async function copy() {
    if (copying) return;
    setCopying(true);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(answerText(message, notSaved));
      setStatus("Risposta copiata, con riferimenti e avvertenze presenti.");
    } catch {
      setStatus("Il browser non consente la copia. Puoi scaricare il testo con il pulsante accanto.");
    } finally { setCopying(false); }
  }

  function download() {
    try {
      downloadText(answerText(message, notSaved), exportFileName(answerMetadata(message).title || "risposta"));
      setStatus("Download del testo avviato.");
    } catch { setStatus("Download non riuscito. Riprova o seleziona e copia il testo della risposta."); }
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" data-guimmia-action disabled={copying} onClick={() => void copy()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50">
          {status.startsWith("Risposta copiata") ? <Check size={15} /> : <Copy size={15} />}
          {copying ? "Copia…" : "Copia risposta"}
        </button>
        <button type="button" data-guimmia-action onClick={download} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
          <Download size={15} /> Scarica testo
        </button>
      </div>
      {status ? <p role="status" className="mt-2 text-sm leading-5 text-slate-500">{status}</p> : null}
    </div>
  );
}
