"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, BookOpen, Award, MessageSquare, Settings, LayoutDashboard, Trophy, Calendar, ArrowRight, X, Command, ClipboardCheck, Users, FileCheck2, BarChart3, Megaphone } from "lucide-react";

/** Visually hidden but exposed to assistive tech — for the required dialog title. */
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

type CommandItem = {
  id: string;
  title: string;
  category: "Navigasi" | "Materi" | "Aksi Eksekutif";
  icon: React.ElementType;
  href?: string;
  action?: () => void;
};

const sharedItems: CommandItem[] = [
  { id: "nav-dash", title: "Ringkasan Dashboard Utama", category: "Navigasi", icon: LayoutDashboard, href: "/dashboard" },
  { id: "nav-prog", title: "Katalog Program Kepemimpinan", category: "Navigasi", icon: BookOpen, href: "/program" },
  { id: "nav-lead", title: "Papan Peringkat Eksekutif (Leaderboard)", category: "Navigasi", icon: Trophy, href: "/peringkat" },
  { id: "nav-forum", title: "Forum Komunitas & Diskusi", category: "Navigasi", icon: MessageSquare, href: "/forum" },
  { id: "nav-cal", title: "Kalender Acara & Sesi Mentor", category: "Navigasi", icon: Calendar, href: "/kalender" },
  { id: "nav-set", title: "Pengaturan Akun & Profil", category: "Navigasi", icon: Settings, href: "/pengaturan" },
];

const roleItems: Record<string, CommandItem[]> = {
  STUDENT: [
    { id: "student-cert", title: "Sertifikat & Kelulusan Saya", category: "Navigasi", icon: Award, href: "/dashboard#sertifikat" },
    { id: "student-attendance", title: "Absensi Saya", category: "Navigasi", icon: ClipboardCheck, href: "/absensi" },
    { id: "student-history", title: "Riwayat Belajar", category: "Navigasi", icon: BookOpen, href: "/riwayat" },
  ],
  MENTOR: [
    { id: "mentor-participants", title: "Manajemen Peserta", category: "Aksi Eksekutif", icon: Users, href: "/dashboard/peserta" },
    { id: "mentor-grading", title: "Evaluasi & Penilaian", category: "Aksi Eksekutif", icon: FileCheck2, href: "/mentor/evaluasi" },
    { id: "mentor-attendance", title: "Manajemen Absensi", category: "Aksi Eksekutif", icon: ClipboardCheck, href: "/absensi" },
    { id: "mentor-analytics", title: "Analitik Program", category: "Aksi Eksekutif", icon: BarChart3, href: "/dashboard/analitik" },
  ],
  SUPER_ADMIN: [
    { id: "admin-users", title: "Kelola Pengguna & Peran", category: "Aksi Eksekutif", icon: Users, href: "/dashboard#admin-user-mgmt" },
    { id: "admin-programs", title: "Kelola Program & Materi", category: "Aksi Eksekutif", icon: BookOpen, href: "/dashboard#program" },
    { id: "admin-broadcast", title: "Kelola Siaran", category: "Aksi Eksekutif", icon: Megaphone, href: "/dashboard#broadcast-mgmt" },
    { id: "admin-attendance", title: "Manajemen Absensi", category: "Aksi Eksekutif", icon: ClipboardCheck, href: "/absensi" },
    { id: "admin-analytics", title: "Analitik Platform", category: "Aksi Eksekutif", icon: BarChart3, href: "/dashboard/analitik" },
  ],
};

export function CommandPalette({ isOpen, onClose, role }: { isOpen: boolean; onClose: () => void; role: string }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [courseItems, setCourseItems] = useState<CommandItem[]>([]);
  const router = useRouter();
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Remember what had focus before the palette opened, so it can be handed back
  // on close (WCAG 2.4.3). Radix's modal Content normally restores focus to its
  // <Dialog.Trigger>, but this palette is opened externally (Ctrl+K, or a button
  // in the dashboard chrome) and renders no Trigger — so that ref is null and
  // focus would otherwise be dumped on <body>. Tracked while closed only; once
  // open, Radix traps focus inside the panel anyway.
  useEffect(() => {
    if (isOpen) return;
    // Driven only by real focusin events — never sampled eagerly on mount.
    // Sampling would re-run the moment `isOpen` flips back to false, while the
    // palette's own input is still focused mid-unmount, and clobber the trigger
    // with a detached node.
    const remember = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || el === document.body || el.closest('[role="dialog"]')) return;
      restoreFocusRef.current = el;
    };
    document.addEventListener("focusin", remember);
    return () => document.removeEventListener("focusin", remember);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || courseItems.length > 0) return;
    let cancelled = false;
    fetch("/api/courses")
      .then(r => (r.ok ? r.json() : []))
      .then((courses: Array<{ id: string; slug: string; title: string }>) => {
        if (cancelled || !Array.isArray(courses)) return;
        setCourseItems(courses.map(c => ({
          id: `course-${c.id}`,
          title: c.title,
          category: "Materi" as const,
          icon: BookOpen,
          href: `/program/${c.slug}`
        })));
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [isOpen, courseItems.length]);

  const items: CommandItem[] = [...sharedItems, ...(roleItems[role] ?? []), ...courseItems];

  const filteredItems = query.trim() === ""
    ? items
    : items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scoped to the dialog rather than `window`: Radix traps focus inside the
  // panel, so every relevant key event bubbles through here. Escape is
  // deliberately NOT handled — Radix owns it via onEscapeKeyDown, which also
  // restores focus to whatever opened the palette.
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      selectItem(filteredItems[selectedIndex]);
    }
  }

  function selectItem(item: CommandItem) {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          animation: "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }} />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={handleKeyDown}
          onCloseAutoFocus={(e: Event) => {
            const target = restoreFocusRef.current;
            if (target?.isConnected) {
              e.preventDefault();
              target.focus();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "12vh",
            pointerEvents: "none",
            animation: "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <Dialog.Title style={srOnly}>Command palette</Dialog.Title>
          <div style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "620px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(42, 107, 167, 0.35)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            color: "#f8fafc",
            pointerEvents: "auto"
          }}>

        {/* Input Bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", gap: "12px", background: "rgba(255, 255, 255, 0.03)" }}>
          <Search size={20} style={{ color: "#2a6ba7" }} />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-listbox"
            aria-activedescendant={filteredItems[selectedIndex]?.id}
            aria-autocomplete="list"
            placeholder="Ketik perintah atau cari materi eksekutif (misal: 'Sertifikat', 'Modul')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f8fafc",
              fontSize: "1rem",
              fontWeight: 500
            }}
          />
          <span style={{ fontSize: "0.7rem", background: "rgba(255, 255, 255, 0.15)", padding: "4px 8px", borderRadius: "6px", color: "#cbd5e1", fontWeight: 700 }}>ESC</span>
          <Dialog.Close aria-label="Tutup" style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", padding: "8px", margin: "-8px", borderRadius: "8px" }}>
            <X size={20} />
          </Dialog.Close>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "380px", overflowY: "auto", padding: "12px" }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
              <Command size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>Tidak ditemukan hasil untuk &quot;{query}&quot;</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", opacity: 0.7 }}>Coba kata kunci lain seperti &quot;Program&quot;, &quot;Forum&quot;, atau &quot;AI&quot;.</p>
            </div>
          ) : (
            <div role="listbox" id="command-palette-listbox" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    id={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: isSelected ? "linear-gradient(90deg, rgba(42, 107, 167, 0.25), rgba(30, 90, 143, 0.15))" : "transparent",
                      border: isSelected ? "1px solid rgba(42, 107, 167, 0.5)" : "1px solid transparent",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: isSelected ? "#2a6ba7" : "rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        transition: "background 0.2s"
                      }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: isSelected ? "#f3b444" : "#f8fafc" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                          {item.category}
                        </div>
                      </div>
                    </div>
                    {isSelected && <ArrowRight size={18} style={{ color: "#f3b444" }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 20px", background: "rgba(0, 0, 0, 0.3)", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <span><kbd style={{ background: "rgba(255, 255, 255, 0.1)", padding: "2px 6px", borderRadius: "4px", color: "#fff" }}>↑↓</kbd> Navigasi</span>
            <span><kbd style={{ background: "rgba(255, 255, 255, 0.1)", padding: "2px 6px", borderRadius: "4px", color: "#fff" }}>Enter</kbd> Pilih</span>
          </div>
          <span style={{ color: "#f3b444", fontWeight: 700 }}>PROFAS Executive Command V1</span>
        </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
