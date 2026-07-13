"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Report only in production to keep dev logs clean and lightweight
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_REPORT_VITALS === "true") {
      const body = JSON.stringify({
        id: metric.id,
        name: metric.name,
        startTime: metric.startTime,
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/vitals", body);
      } else {
        fetch("/api/vitals", {
          body,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {
          // Ignore reporting errors
        });
      }
    }
  });

  return null;
}
