"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Groups are intentionally made from the real PROFAS layout primitives. A
 * group reveals its direct children in sequence, while nested groups let a
 * hero, card grid, or dashboard section reveal at a second level.
 */
const GROUP_SELECTORS = [
  // Public landing pages
  ".al-page > main > section",
  ".al-page .container",
  ".al-hero-grid",
  ".al-hero-copy",
  ".al-hero-visual",
  ".al-hero-actions",
  ".al-proof-row",
  ".al-trust-row",
  ".al-metrics",
  ".al-activity-intro",
  ".al-activity-frame",
  ".al-method-heading",
  ".al-method-grid",
  ".al-section-head",
  ".al-section-row",
  ".al-pathway-grid",
  ".al-split > div",
  ".al-feature-list",
  ".course-grid",
  ".al-insight-grid",
  ".al-insight-cards",
  ".al-outcomes-grid",
  ".al-outcome-list",
  ".al-faq-grid",
  ".al-faq-list",
  ".al-final-box",
  ".footer-grid",
  ".footer-bottom",
  // LMS shell and dashboard role pages
  ".dashboard-sidebar",
  ".dashboard-header",
  ".dashboard-content > *",
  ".dashboard-content section",
  ".dashboard-content .dash-title",
  ".dashboard-content .role-heading",
  ".dashboard-content .hero-banner-student",
  ".dashboard-content .hero-banner-mentor",
  ".dashboard-content .hero-banner-admin",
  ".dashboard-content .dash-hero-layout",
  ".dashboard-content .responsive-stat-grid",
  ".dashboard-content .stat-card-clean",
  ".dashboard-content .dash-focus-grid",
  ".dashboard-content .dash-focus-card",
  ".dashboard-content .dash-roadmap-box",
  ".dashboard-content .dash-roadmap-grid",
  ".dashboard-content .dash-roadmap-node",
  ".dashboard-content .dash-roadmap-banner",
  ".dashboard-content .responsive-main-grid",
  ".dashboard-content .dash-card-clean",
  ".dashboard-content .section-title-clean",
  ".dashboard-content .dash-enroll-list",
  ".dashboard-content .dash-enroll-item",
  ".dashboard-content .dash-sidebar-col > *",
  ".dashboard-content .metric-grid",
  ".dashboard-content .my-programs",
  ".dashboard-content .student-grid",
  ".dashboard-content .mentor-courses",
  ".dashboard-content .agenda-list",
  ".dashboard-content .role-grid",
  ".dashboard-content .activity-list",
  ".dashboard-content .leaf-stagger",
  // Explicit escape hatch for future UI blocks.
  "[data-leaf-stagger]",
] as const;

const ITEM_SELECTORS = [
  // Landing page cards and repeated content
  ".al-metrics > div",
  ".al-method-grid > article",
  ".al-pathway-grid > article",
  ".al-feature-list > div",
  ".course-grid > *",
  ".al-insight-cards > article",
  ".al-outcome-list > div",
  ".al-faq-list > details",
  ".footer-grid > div",
  // Dashboard cards, rows, and common controls
  ".dashboard-content .stat-card-clean",
  ".dashboard-content .dash-roadmap-node",
  ".dashboard-content .dash-enroll-item",
  ".dashboard-content .dash-cert-mini",
  ".dashboard-content .dash-quick-admin-item",
  ".dashboard-content .weekly-card",
  ".dashboard-content .rank-card",
  ".dashboard-content .certificate-mini",
  ".dashboard-content .data-card",
  ".dashboard-content .table-row",
  ".dashboard-content .xp-pill",
  ".dashboard-content .assessment-callout",
  // Any standalone action that is not already owned by a group.
  ".al-page .btn",
  ".al-page .al-btn-primary",
  ".al-page .al-btn-green",
  ".al-page .al-btn-secondary",
  ".dashboard-content button",
  ".dashboard-content a.btn",
  // Manual item escape hatch.
  "[data-leaf-item]",
  ".leaf-item",
] as const;

const LEAF_GROUP_CLASS = "leaf-stagger";
const LEAF_ACTIVE_CLASS = "leaf-active";
const LEAF_ITEM_CLASS = "leaf-item";

function setChildDelays(group: HTMLElement) {
  Array.from(group.children).forEach((child, index) => {
    const element = child as HTMLElement;
    const delay = Math.min(index, 15) * 68 + 42;
    element.style.setProperty("--leaf-delay", `${delay}ms`);
    element.style.setProperty("--leaf-index", String(Math.min(index, 15)));
  });
}

function GlobalLeafStaggerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const target = entry.target as HTMLElement;
          target.classList.add(LEAF_ACTIVE_CLASS);
          target.dataset.leafAnimated = "true";
          observer.unobserve(target);
        });
      },
      {
        // Start a little before the block reaches the viewport so the motion
        // feels continuous on long dashboard pages.
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.04,
      },
    );

    const observedGroups = new WeakSet<HTMLElement>();
    const observedItems = new WeakSet<HTMLElement>();

    const registerGroup = (element: HTMLElement) => {
      element.classList.add(LEAF_GROUP_CLASS);
      setChildDelays(element);

      if (element.dataset.leafAnimated === "true" || observedGroups.has(element)) return;
      observedGroups.add(element);
      observer.observe(element);
    };

    const registerItem = (element: HTMLElement, index: number) => {
      // A parent group owns its direct children. Skipping descendants here
      // avoids two observers fighting over the same animation timeline.
      if (element.closest(`.${LEAF_GROUP_CLASS}`)) return;
      if (element.dataset.leafAnimated === "true" || observedItems.has(element)) return;

      element.classList.add(LEAF_ITEM_CLASS);
      element.classList.add(index % 2 === 1 ? "leaf-odd" : "leaf-even");
      element.dataset.leafIndex = String(Math.min(index, 15));
      element.style.setProperty("--leaf-delay", `${Math.min(index, 15) * 68 + 42}ms`);
      element.style.setProperty("--leaf-index", String(Math.min(index, 15)));
      observedItems.add(element);
      observer.observe(element);
    };

    const scan = () => {
      // Add every group first so item registration can correctly detect the
      // nearest owner, including groups inserted by client-side components.
      GROUP_SELECTORS.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach(registerGroup);
      });

      ITEM_SELECTORS.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
          registerItem(element, index);
        });
      });
    };

    let scanFrame = 0;
    const scheduleScan = () => {
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = 0;
        scan();
      });
    };

    scan();

    // Dashboard widgets and notification panels can arrive after the first
    // paint. Keep the engine live without repeatedly rebuilding the observer.
    const mutationObserver = new MutationObserver(scheduleScan);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname, queryString]);

  return null;
}

export function GlobalLeafStagger() {
  return (
    <Suspense fallback={null}>
      <GlobalLeafStaggerInner />
    </Suspense>
  );
}
