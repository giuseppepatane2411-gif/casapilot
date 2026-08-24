"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, Bot, UserRound } from "lucide-react";

import {
  answerPilotQuestion,
  buildPilotWelcome,
  PILOT_QUICK_QUESTIONS,
} from "@/lib/pilot-os/chat-engine";
import {
  addPilotTimelineEvent,
  createPilotMessage,
  savePilotMessages,
} from "@/lib/pilot-os/store";
import type { PilotContext, PilotMessage } from "@/lib/pilot-os/types";

type PilotChatProps = {
  context: PilotContext;
};

export default function PilotChat({ context }: PilotChatProps) {
  const initialMessages: PilotMessage[] =
    context.memory.messages.length > 0
      ? context.memory.messages
      : [createPilotMessage("assistant", buildPilotWelcome(context))];
  const [messages, setMessages] = useState<PilotMessage[]>(initialMessages);
  const [input, setInput] = useState("");

  function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    const userMessage = createPilotMessage("user", trimmed);
    const assistantMessage = createPilotMessage(
      "assistant",
      answerPilotQuestion(trimmed, context),
    );
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setInput("");
    savePilotMessages(context.journey.id, nextMessages);
    addPilotTimelineEvent(context.journey.id, {
      title: "Guimmia consultato",
      description: `Domanda: “${trimmed.slice(0, 80)}${trimmed.length > 80 ? "…" : ""}”`,
      type: "conversation",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendQuestion(input);
  }

  return (
    <section
      id="pilot-chat"
      className="scroll-mt-24 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
    >
      <header className="border-b border-slate-100 bg-slate-950 px-5 py-5 text-white sm:px-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Bot size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Parla con Guimmia</h2>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Tiene conto dei dati che hai già inserito
              </p>
            </div>
          </div>

        </div>
      </header>

      <div className="max-h-[460px] min-h-[330px] space-y-5 overflow-y-auto bg-slate-50/60 p-5 sm:p-7">
        {messages.map((message) => {
          const assistant = message.role === "assistant";

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${assistant ? "" : "justify-end"}`}
            >
              {assistant && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Bot size={17} />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  assistant
                    ? "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                    : "rounded-tr-md bg-slate-950 text-white"
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
              {!assistant && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                  <UserRound size={17} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {PILOT_QUICK_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => sendQuestion(question)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {question}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Scrivi qui il tuo dubbio…"
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Invia messaggio"
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <ArrowUp size={18} />
          </button>
        </form>
        <p className="mt-2 px-1 text-[11px] leading-5 text-slate-400">
          Guimmia organizza informazioni e priorità; le verifiche tecniche, fiscali e legali restano affidate ai professionisti abilitati.
        </p>
      </div>
    </section>
  );
}

