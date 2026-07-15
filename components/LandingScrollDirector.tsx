"use client";

import { useEffect } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function LandingScrollDirector() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".al-page");
    if (!page) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionTargets = Array.from(
      page.querySelectorAll<HTMLElement>(
        [
          "[data-scroll-speed]",
          ".al-method-card",
          ".al-pathway-card",
          ".course-grid > *",
          ".al-insight-cards > article",
          ".al-outcome-list > div",
          ".al-faq-list > details",
          ".al-final-box",
        ].join(", ")
      )
    );

    if (reducedMotion.matches) return;

    motionTargets.forEach((target, index) => {
      const explicitSpeed = target.dataset.scrollSpeed;
      const defaultSpeed = ((index % 3) - 1) * 0.018;
      target.classList.add("al-motion-target");
      target.style.setProperty(
        "--motion-speed",
        explicitSpeed ?? defaultSpeed.toFixed(3)
      );
    });

    page.classList.add("has-scroll-motion");
    document.documentElement.classList.add("al-scroll-ready");

    let frame = 0;
    let lastY = window.scrollY;
    let velocity = 0;

    const tick = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;
      velocity = velocity * 0.78 + delta * 0.22;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );

      page.style.setProperty(
        "--scroll-velocity",
        `${clamp(velocity, -26, 26)}`
      );
      page.style.setProperty(
        "--scroll-progress",
        `${clamp(currentY / maxScroll, 0, 1)}`
      );

      motionTargets.forEach((target) => {
        const speed = Number(target.style.getPropertyValue("--motion-speed"));
        const bounds = target.getBoundingClientRect();
        const distanceFromCenter =
          window.innerHeight / 2 - (bounds.top + bounds.height / 2);
        const parallax = clamp(distanceFromCenter * speed, -54, 54);
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
      motionTargets.forEach((target) => {
        target.classList.remove("al-motion-target");
        target.style.removeProperty("--motion-speed");
        target.style.removeProperty("--parallax-y");
        target.style.removeProperty("--velocity-y");
      });
      page.classList.remove("has-scroll-motion");
      document.documentElement.classList.remove("al-scroll-ready");
    };
  }, []);

  return null;
}
