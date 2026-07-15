"use client";

import { useEffect } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function LandingScrollDirector() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".al-page");
    if (!page) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const parallaxTargets = Array.from(
      page.querySelectorAll<HTMLElement>("[data-scroll-speed]")
    );

    if (reducedMotion.matches) return;

    document.documentElement.classList.add("al-scroll-ready");

    let frame = 0;
    let lastY = window.scrollY;
    let velocity = 0;

    const tick = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;
      velocity = velocity * 0.78 + delta * 0.22;

      page.style.setProperty(
        "--scroll-velocity",
        `${clamp(velocity, -26, 26)}`
      );

      parallaxTargets.forEach((target) => {
        const speed = Number(target.dataset.scrollSpeed ?? 0);
        const bounds = target.getBoundingClientRect();
        const distanceFromCenter =
          window.innerHeight / 2 - (bounds.top + bounds.height / 2);
        const parallax = clamp(distanceFromCenter * speed, -42, 42);
        const velocityShift = clamp(velocity * speed * 0.65, -12, 12);

        target.style.setProperty("--parallax-y", `${parallax}px`);
        target.style.setProperty("--velocity-y", `${velocityShift}px`);
      });

      if (Math.abs(velocity) > 0.15) {
        frame = window.requestAnimationFrame(tick);
      } else {
        velocity = 0;
        page.style.setProperty("--scroll-velocity", "0");
        frame = 0;
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.classList.remove("al-scroll-ready");
    };
  }, []);

  return null;
}
