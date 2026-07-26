"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function RouteProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const previousRoute = useRef<string | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressFrame = useRef<number | null>(null);

  const clearTimers = () => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (progressFrame.current !== null) cancelAnimationFrame(progressFrame.current);
    finishTimer.current = null;
    progressFrame.current = null;
  };

  useEffect(() => {
    const route = `${pathname}?${searchParams.toString()}`;
    if (previousRoute.current === null) {
      previousRoute.current = route;
      return;
    }
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    clearTimers();
    setVisible(true);
    setProgress(100);
    finishTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      finishTimer.current = null;
    }, 300);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const targetUrl = anchor.href;
      if (!targetUrl || targetUrl.startsWith("#") || targetUrl.startsWith("mailto:") || targetUrl.startsWith("tel:")) {
        return;
      }

      // Cek apakah navigasi ke domain internal / relatif rute
      try {
        const url = new URL(targetUrl, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin === currentUrl.origin && (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search)) {
          clearTimers();
          setVisible(true);
          setProgress(16);
          progressFrame.current = requestAnimationFrame(() => setProgress(64));
        }
      } catch {
        // Abaikan jika bukan URL valid
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
      clearTimers();
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div className="route-progress-bar" aria-hidden="true">
      <div
        className="route-progress-bar__fill"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <RouteProgressBarInner />
    </Suspense>
  );
}
