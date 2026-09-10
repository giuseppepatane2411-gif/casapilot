"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadCloudJourneys } from "@/lib/property-journey/cloud";
import {
  readActiveJourneyId,
  readJourneys,
  setActiveJourneyId,
  subscribeToJourneyChanges,
} from "@/lib/property-journey/storage";
import type { PropertyJourney } from "@/lib/property-journey/types";

type JourneyStoreState = {
  hydrated: boolean;
  refreshing: boolean;
  journeys: PropertyJourney[];
  activeJourneyId: string | null;
  error: string | null;
};

const initialState: JourneyStoreState = {
  hydrated: false,
  refreshing: false,
  journeys: [],
  activeJourneyId: null,
  error: null,
};

export function useJourneys() {
  const [state, setState] = useState<JourneyStoreState>(initialState);
  const cloudReadyRef = useRef(false);

  const refreshFromCache = useCallback(() => {
    const journeys = readJourneys();
    const storedActiveId = readActiveJourneyId();
    const activeJourneyId =
      journeys.find((journey) => journey.id === storedActiveId)?.id ??
      journeys[0]?.id ??
      null;

    setState({
      hydrated: true,
      refreshing: false,
      journeys,
      activeJourneyId,
      error: null,
    });
  }, []);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, refreshing: true, error: null }));

    try {
      const journeys = await loadCloudJourneys();
      cloudReadyRef.current = true;
      const storedActiveId = readActiveJourneyId();
      const activeJourneyId =
        journeys.find((journey) => journey.id === storedActiveId)?.id ??
        journeys[0]?.id ??
        null;

      setState({
        hydrated: true,
        refreshing: false,
        journeys,
        activeJourneyId,
        error: null,
      });
    } catch (error) {
      cloudReadyRef.current = false;
      setState({
        hydrated: true,
        refreshing: false,
        journeys: [],
        activeJourneyId: null,
        error:
          error instanceof Error
            ? error.message
            : "Guimmia non riesce a caricare i tuoi immobili.",
      });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const unsubscribe = subscribeToJourneyChanges(() => {
      if (cloudReadyRef.current) refreshFromCache();
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refresh, refreshFromCache]);

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
