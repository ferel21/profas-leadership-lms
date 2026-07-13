"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * GlobalLeafStaggerInner
 * Engine otomatis untuk mendeteksi elemen UI (teks, gambar, tombol, card)
 * di Landing Page & Dashboard LMS dan memberikan efek animasi seperti daun jatuh
 * yang muncul secara bergantian satu per satu (staggered reveal).
 */
function GlobalLeafStaggerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Abaikan jika preferensi motion user dimatikan di OS
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const initObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              target.classList.add("leaf-active");
              target.setAttribute("data-leaf-animated", "true");
              observerRef.current?.unobserve(target);
            }
          });
        },
        {
          rootMargin: "0px 0px -30px 0px",
          threshold: 0.06,
        }
      );

      // Daftar selektor untuk Landing Page & Dashboard LMS yang akan di-animasikan daun jatuh satu per satu
      const containerSelectors = [
        // Landing Page containers
        ".al-hero-left",
        ".al-hero-right",
        ".al-metrics .container",
        ".al-section-heading",
        ".section-heading",
        ".feature-grid",
        ".course-grid",
        ".al-programs-grid",
        ".journey-steps",
        ".partner-list",
        ".trust-strip .container",
        ".institution-points",
        ".mini-stats",
        ".outcome-list",
        ".curriculum",
        ".footer-grid",
        // LMS Dashboard containers
        ".dash-title",
        ".role-heading",
        ".metric-grid",
        ".my-programs",
        ".student-grid",
        ".mentor-courses",
        ".agenda-list",
        ".role-grid",
        ".activity-list",
        // General manual stagger containers
        ".leaf-stagger"
      ];

      // Daftar selektor elemen individual yang akan di-tag sebagai leaf-item dan di-stagger (indeks 0..15)
      const itemSelectors = [
        // Cards & Boxes
        ".feature-card",
        ".course-card",
        ".al-program-card",
        ".continue-card",
        ".metric-grid article",
        ".my-programs article",
        ".weekly-card",
        ".rank-card",
        ".certificate-mini",
        ".data-card",
        ".mentor-courses > div",
        ".agenda-list > div",
        ".table-row",
        ".xp-pill",
        ".assessment-callout",
        // Headings & Text block in Heroes/Headings
        ".al-hero-left h1",
        ".al-hero-left p",
        ".al-hero-left .al-hero-actions",
        ".al-hero-left .al-hero-trust",
        ".hero-copy h1",
        ".hero-copy p",
        ".hero-actions",
        ".hero-trust",
        ".section-heading h2",
        ".section-heading p",
        ".al-section-heading h2",
        ".al-section-heading p",
        // Standalone animated elements
        ".leaf-item"
      ];

      // 1. Tag & Observer Container Stagger
      containerSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          if (!el.hasAttribute("data-leaf-animated")) {
            el.classList.add("leaf-stagger");
            observerRef.current?.observe(el);
          }
        });
      });

      // 2. Tag & Observer Individual Items (dengan stagger indeks berkelompok)
      itemSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, idx) => {
          if (!el.hasAttribute("data-leaf-animated") && !el.closest(".leaf-stagger")) {
            el.classList.add("leaf-item");
            if (idx % 2 === 1) {
              el.classList.add("leaf-odd");
            } else {
              el.classList.add("leaf-even");
            }
            el.setAttribute("data-leaf-index", String(idx % 16));
            observerRef.current?.observe(el);
          } else if (el.closest(".leaf-stagger")) {
            if (!el.classList.contains("leaf-item")) {
              el.classList.add("leaf-item");
            }
          }
        });
      });
    };

    initObserver();
    const timer = setTimeout(initObserver, 150);
    const timer2 = setTimeout(initObserver, 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [pathname, searchParams]);

  return null;
}

export function GlobalLeafStagger() {
  return (
    <Suspense fallback={null}>
      <GlobalLeafStaggerInner />
    </Suspense>
  );
}
