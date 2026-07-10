"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function RouteProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const previousRoute = useRef<string | null>(null);

  useEffect(() => {
    const route = `${pathname}?${searchParams.toString()}`;
    if (previousRoute.current === null) {
      previousRoute.current = route;
      return;
    }
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    setVisible(true);
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const targetUrl = (event.currentTarget as HTMLElement)?.getAttribute("href") ||
                        (event.target as HTMLElement)?.closest("a")?.getAttribute("href");
      
      if (!targetUrl || targetUrl.startsWith("#") || targetUrl.startsWith("mailto:") || targetUrl.startsWith("tel:")) {
        return;
      }

      // Cek apakah navigasi ke domain internal / relatif rute
      try {
        const url = new URL(targetUrl, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          setVisible(true);
          setProgress(25);
          
          // Simulasi progres saat menunggu respons dari server component
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 85) {
                clearInterval(interval);
                return 85;
              }
              return prev + Math.floor(Math.random() * 15) + 5;
            });
          }, 150);

          return () => clearInterval(interval);
        }
      } catch {
        // Abaikan jika bukan URL valid
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "3.5px",
        zIndex: 999999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #0d9488, #14b8a6, #2dd4bf)",
          boxShadow: "0 0 12px rgba(20, 184, 166, 0.8), 0 0 6px rgba(13, 148, 136, 0.6)",
          transition: progress === 100 ? "width 200ms ease-out, opacity 300ms ease-in" : "width 300ms ease-out",
          opacity: progress === 100 ? 0 : 1,
          borderRadius: "0 4px 4px 0",
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
