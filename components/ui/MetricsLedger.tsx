"use client";

import { useEffect, useRef, useState } from "react";

type MetricStat = { value: number; suffix: string; label: string };

const COUNT_UP_MS = 800;

function formatCount(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function MetricCell({ value, suffix, label }: MetricStat) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / COUNT_UP_MS);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref}>
      <b>
        {formatCount(display)}
        {suffix}
      </b>
      <span>{label}</span>
    </div>
  );
}

export function MetricsLedger({ items }: { items: MetricStat[] }) {
  return (
    <div className="container al-metrics" aria-label="Statistik PROFAS">
      {items.map((item) => (
        <MetricCell key={item.label} {...item} />
      ))}
    </div>
  );
}
