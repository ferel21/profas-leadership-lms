"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Award, MessageSquare, Settings, LayoutDashboard, Trophy, Calendar, Sparkles, ArrowRight, X, Command } from "lucide-react";

type CommandItem = {
  id: string;
  title: string;
  category: "Navigasi" | "Materi" | "Aksi Eksekutif";
  icon: React.ElementType;
  href?: string;
  action?: () => void;
};

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const items: CommandItem[] = [
    { id: "nav-dash", title: "Ringkasan Dashboard Utama", category: "Navigasi", icon: LayoutDashboard, href: "/dashboard" },
    { id: "nav-prog", title: "Katalog Program Kepemimpinan", category: "Navigasi", icon: BookOpen, href: "/program" },
    { id: "nav-cert", title: "Sertifikat & Kelulusan Saya", category: "Navigasi", icon: Award, href: "/dashboard#sertifikat" },
    { id: "nav-lead", title: "Papan Peringkat Eksekutif (Leaderboard)", category: "Navigasi", icon: Trophy, href: "/peringkat" },
    { id: "nav-forum", title: "Forum Komunitas & Diskusi", category: "Navigasi", icon: MessageSquare, href: "/forum" },
    { id: "nav-cal", title: "Kalender Acara & Sesi Mentor", category: "Navigasi", icon: Calendar, href: "/kalender" },
    { id: "nav-set", title: "Pengaturan Akun & Profil", category: "Navigasi", icon: Settings, href: "/pengaturan" },
    { id: "mat-1", title: "Modul: Fondasi Kepemimpinan Berdampak", category: "Materi", icon: BookOpen, href: "/belajar/fondasi-kepemimpinan-berdampak" },
    { id: "mat-2", title: "Modul: Memimpin Diri & Percakapan Sulit", category: "Materi", icon: BookOpen, href: "/belajar/fondasi-kepemimpinan-berdampak" },
    { id: "mat-3", title: "Evaluasi & Pretest Kepemimpinan", category: "Materi", icon: Award, href: "/dashboard/evaluasi" },
    { id: "act-ai", title: "Tanya Asisten AI Leadership Tutor", category: "Aksi Eksekutif", icon: Sparkles, href: "/dashboard#ai-tutor" },
  ];

  const filteredItems = query.trim() === "" 
    ? items 
    : items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        selectItem(filteredItems[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filteredItems, selectedIndex]);

  function selectItem(item: CommandItem) {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingTop: "12vh",
      animation: "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
    }} onClick={onClose}>
      <div style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "620px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(13, 148, 136, 0.3)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        color: "#f8fafc"
      }} onClick={e => e.stopPropagation()}>
        
        {/* Input Bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", gap: "12px", background: "rgba(255, 255, 255, 0.03)" }}>
          <Search size={20} style={{ color: "#0d9488" }} />
          <input
            type="text"
            placeholder="Ketik perintah atau cari materi eksekutif (misal: 'Sertifikat', 'Modul')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
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
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
            <X size={20} />
          </button>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: isSelected ? "linear-gradient(90deg, rgba(13, 148, 136, 0.25), rgba(6, 182, 212, 0.15))" : "transparent",
                      border: isSelected ? "1px solid rgba(13, 148, 136, 0.5)" : "1px solid transparent",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: isSelected ? "#0d9488" : "rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        transition: "background 0.2s"
                      }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: isSelected ? "#38bdf8" : "#f8fafc" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                          {item.category}
                        </div>
                      </div>
                    </div>
                    {isSelected && <ArrowRight size={18} style={{ color: "#38bdf8" }} />}
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
          <span style={{ color: "#0d9488", fontWeight: 700 }}>PROFAS Executive Command V1</span>
        </div>
      </div>
    </div>
  );
}
