"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Compass,
  Lightbulb,
  LogIn,
  Menu,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "./Logo";

const navigation = [
  { href: "/program", label: "Program", icon: BookOpen, prefetch: true },
  { href: "/#cara-belajar", label: "Cara belajar", icon: Compass },
  { href: "/#tentang", label: "Tentang", icon: Lightbulb },
  { href: "/#insight", label: "Ruang kerja", icon: UsersRound },
  { href: "/#faq", label: "FAQ", icon: CircleHelp },
];

export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const navigate = () => setOpen(false);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable.at(0);
    const last = focusable.at(-1);

    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="menu-button pf-menu-trigger"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        aria-expanded={open}
        aria-controls="pf-mobile-navigation"
      >
        <Menu size={21} aria-hidden="true" />
        <span className="pf-menu-trigger__label">Menu</span>
      </button>

      {open && (
        <div
          id="pf-mobile-navigation"
          className="mobile-menu pf-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi utama"
          onKeyDown={handleDialogKeyDown}
        >
          <div className="pf-mobile-menu__header">
            <Logo />
            <button
              type="button"
              className="pf-mobile-menu__close"
              onClick={close}
              aria-label="Tutup menu"
              autoFocus
            >
              <X aria-hidden="true" />
            </button>
          </div>

          <section className="pf-mobile-menu__body">
            <p className="pf-mobile-menu__eyebrow">
              <Compass size={15} aria-hidden="true" />
              Jalur kepemimpinan
            </p>
            <nav className="pf-mobile-menu__nav" aria-label="Menu utama">
              {navigation.map(item => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={item.prefetch}
                    onClick={navigate}
                  >
                    <span className="pf-mobile-menu__nav-icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.8} />
                    </span>
                    <span>{item.label}</span>
                    <ArrowRight
                      className="pf-mobile-menu__nav-arrow"
                      size={17}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </nav>
          </section>

          <Link
            href={signedIn ? "/dashboard" : "/daftar"}
            prefetch={true}
            onClick={navigate}
            className="btn btn-primary pf-mobile-menu__cta"
          >
            <span>{signedIn ? "Buka Dashboard" : "Mulai Belajar"}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {!signedIn && (
            <Link
              href="/masuk"
              prefetch={true}
              onClick={navigate}
              className="mobile-login pf-mobile-menu__login"
            >
              <LogIn size={16} aria-hidden="true" />
              <span>Sudah punya akun? Masuk</span>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
