"use client";

import { useCallback, useEffect, useState } from "react";

import {
  readJourneyPilotMemory,
  subscribeToPilotMemoryChanges,
  touchJourneyPilotMemory,
} from "@/lib/pilot-os/store";
import type { JourneyPilotMemory } from "@/lib/pilot-os/types";

export function usePilotMemory(journeyId: string | null) {
  const [memory, setMemory] = useState<JourneyPilotMemory | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    if (!journeyId) {
      setMemory(null);
      setHydrated(true);
      return;
    }

    setMemory(readJourneyPilotMemory(journeyId));
    setHydrated(true);
  }, [journeyId]);

  useEffect(() => {
    if (journeyId) touchJourneyPilotMemory(journeyId);

    const timer = window.setTimeout(refresh, 0);
    const unsubscribe = subscribeToPilotMemoryChanges(refresh);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [journeyId, refresh]);

  return {
    memory,
    hydrated,
    refresh,
  };
}
