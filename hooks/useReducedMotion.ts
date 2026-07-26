"use client";

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the user's `prefers-reduced-motion` system setting, staying in sync if
 * they change it while the page is open (no reload required).
 *
 * This exists because CSS `@media (prefers-reduced-motion: reduce)` blocks can
 * only neutralise CSS animations and transitions. They cannot reach motion that
 * JavaScript owns — a scroll library hijacking the window's scrolling, inline
 * `transform`/`filter` styles written on every scroll frame, or elements whose
 * very presence in the DOM is the animation (e.g. a confetti burst). Components
 * driving that kind of motion have to opt out themselves, and this hook is how.
 *
 * Returns `false` during SSR and on the first client render, then updates after
 * mount — so treat `true` as "definitely reduce" rather than gating essential
 * content on it.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
