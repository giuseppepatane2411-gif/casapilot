"use client";

import { useCallback, useEffect, useState } from "react";

import {
  readBetaState,
  subscribeToBetaStateChanges,
} from "@/lib/beta/storage";
import type { BetaState } from "@/lib/beta/types";

export function useBetaState() {
  const [state, setState] = useState<BetaState | null>(null);

  const refresh = useCallback(() => {
    setState(readBetaState());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    const unsubscribe = subscribeToBetaStateChanges(refresh);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refresh]);

  return {
    hydrated: Boolean(state),
    state,
    refresh,
  };
}
