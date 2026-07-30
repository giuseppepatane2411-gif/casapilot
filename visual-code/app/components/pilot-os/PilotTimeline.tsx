import {
  Bot,
  CalendarClock,
  CheckCircle2,
  FileText,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import type { PilotTimelineEvent } from "@/lib/pilot-os/types";

type PilotTimelineProps = {
  events: PilotTimelineEvent[];
};

export default function PilotTimeline({ events }: PilotTimelineProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <CalendarClock size={19} />
        </span>
        <div>
          <p className="text-sm font-semibold text-blue-600">Memoria viva</p>
          <h2 className="text-xl font-bold text-slate-950">Timeline immobile</h2>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {events.slice(0, 7).map((event, index) => (
          <div key={event.id} className="relative flex gap-3">
            {index < Math.min(events.length, 7) - 1 && (
              <span className="absolute left-[17px] top-9 h-[calc(100%+4px)] w-px bg-slate-200" />
            )}
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <TimelineIcon type={event.type} />
            </span>
            <div className="pb-1">
              <p className="text-sm font-bold text-slate-900">{event.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {event.description}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                {formatDate(event.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineIcon({ type }: { type: PilotTimelineEvent["type"] }) {
  if (type === "document") return <FileText size={16} />;
  if (type === "conversation") return <MessageCircle size={16} />;
  if (type === "mission") return <CheckCircle2 size={16} />;
  if (type === "milestone") return <Sparkles size={16} />;
  return <Bot size={16} />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
