"use client";

import { useEffect, useState } from "react";

import { requestSiteOrchestration } from "@/lib/guimmia/site-orchestration/client";
import {
  cacheSiteDecision,
  readCachedSiteDecision,
} from "@/lib/guimmia/site-orchestration/cache";
import {
  phaseToPlaybookStage,
  toGuimmiaOperationType,
} from "@/lib/guimmia/site-orchestration/operation";
import type { SiteOrchestrationResponse } from "@/lib/guimmia/site-orchestration/types";
import type { GoalProgressPhaseId } from "@/lib/pilot-os/goal-progress";
import type { PropertyJourney } from "@/lib/property-journey/types";

type OrchestrationState = {
  loading: boolean;
  decision: SiteOrchestrationResponse | null;
  error: boolean;
};

export function useGuimmiaOrchestration(
  journey: PropertyJourney,
  currentPhase: GoalProgressPhaseId,
) {
  const [state, setState] = useState<OrchestrationState>({
    loading: true,
    decision: null,
    error: false,
  });
  const documentKey = journey.documents.join("|");

  useEffect(() => {
    let active = true;
    const operationType = toGuimmiaOperationType(journey.operation);
    const cachedDecision = readCachedSiteDecision(journey.id);

    setState({
      loading: true,
      decision: cachedDecision,
      error: false,
    });

    requestSiteOrchestration({
      caseId: journey.id,
      caseVersion: 1,
      operationType,
      customerRole: operationType === "SALE" ? "OWNER" : "LANDLORD",
      property: {
        id: journey.id,
        type: journey.property.type,
        country: journey.property.country,
        city: journey.property.city,
        province: journey.property.province,
        address: journey.property.address,
        locationVerified: journey.property.locationVerified,
        documents: journey.documents,
      },
      progress: {
        currentPhase: phaseToPlaybookStage(currentPhase, operationType),
      },
    })
      .then((decision) => {
        if (!active) return;
        cacheSiteDecision(journey.id, decision);
        setState({ loading: false, decision, error: false });
      })
      .catch(() => {
        if (!active) return;
        setState((current) => ({
          loading: false,
          decision: current.decision,
          error: true,
        }));
      });

    return () => {
      active = false;
    };
  }, [
    currentPhase,
    documentKey,
    journey.id,
    journey.operation,
    journey.property.address,
    journey.property.city,
    journey.property.country,
    journey.property.locationVerified,
    journey.property.province,
    journey.property.type,
  ]);

  return state;
}
