"use client";

import { useEffect, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import {
  loadProfessionalState,
  saveJob,
} from "@/lib/professional-os/repository";
import type {
  Job,
  ProfessionalOsState,
} from "@/lib/professional-os/types";
import {
  Badge,
  Button,
  EmptyState,
  Heading,
  Page,
} from "./ui";

const JOB_STATUS_LABELS: Record<Job["status"], string> = {
  pending: "Da organizzare",
  appointment_scheduled: "Appuntamento fissato",
  waiting_documents: "In attesa di documenti",
  in_progress: "In corso",
  waiting_owner: "In attesa dell’utente",
  completed: "Completato",
  issue_reported: "Problema segnalato",
  cancelled: "Annullato",
};

export default function JobsCenter() {
  const [state, setState] =
    useState<ProfessionalOsState | null>(null);

  const refresh = () => setState(loadProfessionalState());

  useEffect(() => {
    refresh();
  }, []);

  const updateStatus = (
    job: Job,
    status: Job["status"],
  ) => {
    saveJob({
      ...job,
      status,
      startedAt:
        status === "in_progress"
          ? job.startedAt ?? new Date().toISOString()
          : job.startedAt,
      completedAt:
        status === "completed"
          ? new Date().toISOString()
          : job.completedAt,
      updatedAt: new Date().toISOString(),
    });
    refresh();
  };

  return (
    <Page>
      <Heading
        eyebrow="Dopo lo sblocco"
        title="Incarichi"
        description="Guimmia continua a seguire il lavoro dopo l’accettazione per misurare il valore reale della lead e abilitare recensioni verificate."
      />

      {!state || state.jobs.length === 0 ? (
        <EmptyState
          title="Nessun incarico attivo"
          description="Un incarico nasce soltanto dopo l’accettazione di un preventivo e lo sblocco dei contatti."
        />
      ) : (
        <div className="space-y-4">
          {state.jobs.map((job) => {
            const lead = state.leads.find(
              (item) => item.id === job.leadId,
            );
            return (
              <article
                key={job.id}
                className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <Badge
                      tone={
                        job.status === "completed"
                          ? "success"
                          : job.status === "issue_reported"
                            ? "danger"
                            : "blue"
                      }
                    >
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>
                    <h2 className="mt-3 text-lg font-semibold">
                      {findService(lead?.serviceId)?.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {lead?.propertyLabel}
                    </p>
                  </div>

                  {job.status !== "completed" &&
                  job.status !== "cancelled" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          updateStatus(job, "in_progress")
                        }
                      >
                        Segna in corso
                      </Button>
                      <Button
                        onClick={() =>
                          updateStatus(job, "completed")
                        }
                      >
                        Completa
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
