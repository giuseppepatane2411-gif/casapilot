"use client";

import { useCallback, useEffect, useState } from "react";

import {
  readActiveJourneyId,
  readJourneys,
  setActiveJourneyId,
  subscribeToJourneyChanges,
} from "@/lib/property-journey/storage";
import type { PropertyJourney } from "@/lib/property-journey/types";

type JourneyStoreState = {
  hydrated: boolean;
  journeys: PropertyJourney[];
  activeJourneyId: string | null;
};

const initialState: JourneyStoreState = {
  hydrated: false,
  journeys: [],
  activeJourneyId: null,
};

export function useJourneys() {
  const [state, setState] = useState<JourneyStoreState>(initialState);

  const refresh = useCallback(() => {
    const journeys = readJourneys();
    const storedActiveId = readActiveJourneyId();
    const activeJourneyId =
      journeys.find((journey) => journey.id === storedActiveId)?.id ??
      journeys[0]?.id ??
      null;

    setState({
      hydrated: true,
      journeys,
      activeJourneyId,
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    const unsubscribe = subscribeToJourneyChanges(refresh);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refresh]);

  const activateJourney = useCallback((journeyId: string) => {
    setActiveJourneyId(journeyId);
  }, []);

  const activeJourney =
    state.journeys.find(
      (journey) => journey.id === state.activeJourneyId,
    ) ?? state.journeys[0] ?? null;

  return {
    ...state,
    activeJourney,
    activateJourney,
    refresh,
  };
}
