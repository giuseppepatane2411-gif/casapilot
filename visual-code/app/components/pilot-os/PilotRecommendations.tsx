"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb, X } from "lucide-react";

import { dismissPilotRecommendation } from "@/lib/pilot-os/store";
import type { PilotRecommendation } from "@/lib/pilot-os/types";

type PilotRecommendationsProps = {
  journeyId: string;
  recommendations: PilotRecommendation[];
};

export default function PilotRecommendations({
  journeyId,
  recommendations,
}: PilotRecommendationsProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Lightbulb size={21} />
        </span>
        <div>
          <p className="text-sm font-semibold text-blue-600">Advisor</p>
          <h2 className="text-2xl font-bold text-slate-950">
            Opportunità intelligenti
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onDismiss={() =>
              dismissPilotRecommendation(journeyId, recommendation.id)
            }
          />
        ))}
      </div>
    </section>
  );
}

type RecommendationCardProps = {
  recommendation: PilotRecommendation;
  onDismiss: () => void;
};

function RecommendationCard({
  recommendation,
  onDismiss,
}: RecommendationCardProps) {
  return (
    <article className="group relative flex min-h-52 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Nascondi consiglio: ${recommendation.title}`}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 hover:bg-white hover:text-slate-700 group-hover:opacity-100"
      >
        <X size={15} />
      </button>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            recommendation.impact === "high"
              ? "bg-red-50 text-red-600"
              : recommendation.impact === "medium"
                ? "bg-amber-50 text-amber-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          Impatto {recommendation.impact}
        </span>
      </div>
      <h3 className="mt-4 pr-7 text-lg font-bold text-slate-950">
        {recommendation.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {recommendation.description}
      </p>

      {recommendation.href && recommendation.actionLabel && (
        <Link
          href={recommendation.href}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          {recommendation.actionLabel}
          <ArrowRight size={15} />
        </Link>
      )}
    </article>
  );
}
