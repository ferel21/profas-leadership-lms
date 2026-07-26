"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * The reveal engine is intentionally selector-driven so existing landing and
 * dashboard markup does not need layout-changing wrapper divs. Every scene is
 * revealed recursively, with each level sorted by its real viewport position.
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
const LEAF_ITEM_CLASS = "leaf-item";
const REVEAL_STATE = "data-leaf-state";
const REVEAL_GROUP_STATE = "data-leaf-group-state";
const STAGGER_DELAY_MS = 110;
const ANIMATION_DURATION_MS = 580;
const REVEAL_OFFSET = "-18px";

function isRevealable(element: HTMLElement) {
  return element.dataset.leafIgnore !== "true" && element.getAttribute("aria-hidden") !== "true";
}

function sortTopToBottom(elements: HTMLElement[]) {
  return [...elements].sort((a, b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    const topDifference = aRect.top - bRect.top;

    if (Math.abs(topDifference) > 2) return topDifference;
    return aRect.left - bRect.left;
  });
}

function directRevealChildren(group: HTMLElement) {
  return sortTopToBottom(
    Array.from(group.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && isRevealable(child),
    ),
  );
}

function GlobalLeafStaggerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    if (typeof IntersectionObserver === "undefined") {
      // The CSS layer is intentionally defensive, so browsers without
      // IntersectionObserver must explicitly release any already-marked
      // elements instead of inheriting opacity: 0 forever.
      document
        .querySelectorAll<HTMLElement>(`.${LEAF_GROUP_CLASS} > *, .${LEAF_ITEM_CLASS}`)
        .forEach((element) => {
          if (!isRevealable(element)) return;
          element.setAttribute(REVEAL_STATE, "done");
          element.style.opacity = "1";
          element.style.setProperty("--reveal-offset", "0px");
        });
      return;
    }

    const activeAnimations = new Set<Animation>();
    const revealTimers = new Set<number>();
    let visibleCheckFrame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        sortTopToBottom(
          entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => entry.target as HTMLElement),
        ).forEach((target) => {
          observer.unobserve(target);
          if (target.classList.contains(LEAF_GROUP_CLASS)) {
            revealGroup(target, 0);
          } else {
            revealElement(target, 0);
          }
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.04,
      },
    );

    const revealElement = (element: HTMLElement, delayMs: number) => {
      const state = element.getAttribute(REVEAL_STATE);
      if (state === "done" || state === "running") return;

      element.classList.add(LEAF_ITEM_CLASS);
      element.setAttribute(REVEAL_STATE, "running");
      element.style.setProperty("--reveal-offset", REVEAL_OFFSET);

      let controls: Animation | null = null;
      let fallbackTimer = 0;
      const completeReveal = (forceStop = false) => {
        if (fallbackTimer) {
          window.clearTimeout(fallbackTimer);
          revealTimers.delete(fallbackTimer);
          fallbackTimer = 0;
        }
        if (forceStop && controls) controls.cancel();
        if (controls) activeAnimations.delete(controls);
        element.setAttribute(REVEAL_STATE, "done");
        element.style.opacity = "1";
        element.style.setProperty("--reveal-offset", "0px");
      };

      try {
        controls = element.animate(
          [
            { opacity: 0, translate: `0 ${REVEAL_OFFSET}` },
            { opacity: 1, translate: "0 0" },
          ],
          {
            delay: delayMs,
            duration: ANIMATION_DURATION_MS,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both",
          },
        );

        activeAnimations.add(controls);
        fallbackTimer = window.setTimeout(
          () => completeReveal(true),
          delayMs + ANIMATION_DURATION_MS + 180,
        );
        revealTimers.add(fallbackTimer);
        controls.finished
          .then(() => completeReveal())
          .catch(() => completeReveal());
      } catch {
        // Older browsers still get the content, just without the motion layer.
        completeReveal();
      }
    };

    const revealGroup = (group: HTMLElement, baseDelayMs: number) => {
      // A group can itself be a reveal item when it is nested below a
      // non-group layout wrapper. Reveal that wrapper too; otherwise its
      // children can be marked done while the wrapper remains opacity: 0.
      if (group.classList.contains(LEAF_ITEM_CLASS)) {
        revealElement(group, baseDelayMs);
      }
      group.setAttribute(REVEAL_GROUP_STATE, "done");

      directRevealChildren(group).forEach((child, index) => {
        const delayMs = baseDelayMs + index * STAGGER_DELAY_MS;
        revealElement(child, delayMs);

        // Nested groups begin after their parent has mostly settled. This
        // keeps the whole section top-to-bottom instead of racing in parallel.
        if (child.classList.contains(LEAF_GROUP_CLASS)) {
          revealGroup(child, delayMs + ANIMATION_DURATION_MS * 0.55);
        }
      });
    };

    const prepareGroup = (group: HTMLElement) => {
      group.classList.add(LEAF_GROUP_CLASS);
      directRevealChildren(group).forEach((child) => {
        child.classList.add(LEAF_ITEM_CLASS);
        if (child.getAttribute(REVEAL_STATE) === "done") {
          child.style.opacity = "1";
          child.style.setProperty("--reveal-offset", "0px");
        } else {
          child.style.setProperty("--reveal-offset", REVEAL_OFFSET);
        }
      });
    };

    const prepareItem = (item: HTMLElement) => {
      if (item.closest(`.${LEAF_GROUP_CLASS}`)) return;
      if (item.getAttribute(REVEAL_STATE) === "done") return;

      item.classList.add(LEAF_ITEM_CLASS);
      item.style.setProperty("--reveal-offset", REVEAL_OFFSET);
      observer.observe(item);
    };

    const observeTopLevelGroups = () => {
      topLevelGroups().forEach((group) => {

        if (group.getAttribute(REVEAL_GROUP_STATE) === "done") {
          revealGroup(group, 0);
          return;
        }

        observer.observe(group);
      });
    };

    const topLevelGroups = () => Array.from(
      document.querySelectorAll<HTMLElement>(`.${LEAF_GROUP_CLASS}`),
    ).filter((group) => !group.parentElement?.closest(`.${LEAF_GROUP_CLASS}`));

    const isInViewport = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.height > 0 && rect.bottom > 0 && rect.top < viewportHeight;
    };

    const revealVisibleElements = () => {
      visibleCheckFrame = 0;

      // IntersectionObserver is the primary trigger. This synchronous
      // viewport check is a safety net for hydration, prerendered Chromium,
      // and browsers that delay their first observer callback.
      sortTopToBottom(topLevelGroups().filter(isInViewport)).forEach((group, index) => {
        if (group.getAttribute(REVEAL_GROUP_STATE) === "done") return;
        observer.unobserve(group);
        revealGroup(group, index * STAGGER_DELAY_MS);
      });

      document.querySelectorAll<HTMLElement>(`.${LEAF_ITEM_CLASS}`).forEach((item) => {
        // Some existing dashboard blocks contain a revealable item several
        // levels below its group wrapper. If an observer callback misses that
        // nested relationship, the visible-item safety net must still finish
        // it rather than leaving the child at opacity: 0 forever.
        if (!isInViewport(item)) return;
        observer.unobserve(item);
        if (item.classList.contains(LEAF_GROUP_CLASS)) {
          revealGroup(item, 0);
        } else {
          revealElement(item, 0);
        }
      });
    };

    const scheduleVisibleReveal = () => {
      if (visibleCheckFrame) return;
      visibleCheckFrame = window.requestAnimationFrame(revealVisibleElements);
    };

    const scan = () => {
      // Group classes are added before item classes so every child knows its
      // nearest owner and nested groups can be sequenced recursively.
      GROUP_SELECTORS.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach(prepareGroup);
      });

      ITEM_SELECTORS.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach(prepareItem);
      });

      observeTopLevelGroups();
      scheduleVisibleReveal();
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

    window.addEventListener("scroll", scheduleVisibleReveal, { passive: true });
    window.addEventListener("resize", scheduleVisibleReveal);
    const initialRevealFallback = window.setTimeout(revealVisibleElements, 180);

    const mutationObserver = new MutationObserver(scheduleScan);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
      if (visibleCheckFrame) window.cancelAnimationFrame(visibleCheckFrame);
      window.clearTimeout(initialRevealFallback);
      revealTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("scroll", scheduleVisibleReveal);
      window.removeEventListener("resize", scheduleVisibleReveal);
      mutationObserver.disconnect();
      observer.disconnect();
      activeAnimations.forEach((controls) => controls.cancel());
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
