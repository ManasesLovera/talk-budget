"use client";

import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Mount-only viewport check (no resize/change listener). Defaults to false
 * on both server and initial client render to avoid a hydration mismatch,
 * then resolves once in an effect. Used to decide one-time navigation
 * behavior (e.g. redirecting "/" to "/dashboard" on desktop) without
 * yanking a user mid-session if they resize past the breakpoint later.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.matchMedia(DESKTOP_QUERY).matches);
  }, []);

  return isDesktop;
}
