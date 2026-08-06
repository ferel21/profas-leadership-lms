"use client";

import { useEffect, useState, useTransition } from "react";
import { Trophy, LoaderCircle } from "lucide-react";
import { initials, personaLabel } from "@/utils";
import { Persona } from "@prisma/client";

type LeaderboardUser = {
  id: string;
  name: string;
  persona: Persona;
  xp: number;
  badges: { id: string; name: string }[];
};

export function LeaderboardClient({ user }: { user: { id: string; name: string; email: string; role: string; persona: Persona } }) {
  const [ranking, setRanking] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "monthly" | "weekly">("all");
  const [personaFilter, setPersonaFilter] = useState<Persona | "ALL">("ALL");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("timeframe", timeframe);
        if (personaFilter !== "ALL") {
          params.set("persona", personaFilter);
        }
        
        const response = await fetch(`/api/leaderboard?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          startTransition(() => {
            setRanking(data);
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data papan peringkat", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchLeaderboard();
  }, [timeframe, personaFilter]);

  return (
    <>
      <div className="leaderboard-heading">
        <span className="heading-icon-wrap"><Trophy size={28} /></span>
        <div>
          <p className="heading-eyebrow">PAPAN PERINGKAT</p>
          <h1 className="heading-title">Pemimpin yang konsisten bertumbuh</h1>
          <small className="heading-desc">XP berasal dari materi dan evaluasi yang berhasil diselesaikan.</small>
        </div>
      </div>

      <div className="leaderboard-filters-wrapper">
        <div className="segmented-control">
          {(["all", "monthly", "weekly"] as const).map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`segmented-btn ${timeframe === tf ? "active" : ""}`}
            >
              {tf === "all" ? "Semua Waktu" : tf === "monthly" ? "Bulan Ini" : "Minggu Ini"}
            </button>
          ))}
        </div>

        <div className="filter-select-wrapper">
          <label htmlFor="persona-filter" className="sr-only">Filter Profil</label>
          <select 
            id="persona-filter" 
            value={personaFilter} 
            onChange={(e) => setPersonaFilter(e.target.value as Persona | "ALL")}
            className="modern-select"
          >
            <option value="ALL">Semua Profil</option>
            {Object.values(Persona).map(p => (
              <option key={p} value={p}>{personaLabel(p)}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ transition: 'opacity 0.3s ease', opacity: (loading || isPending) ? 0.5 : 1, position: 'relative', minHeight: '300px' }}>
        {loading && ranking.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <LoaderCircle className="spin text-muted" size={32} />
          </div>
        )}

        {ranking.length > 0 && (
          <section className="podium-grid">
            {/* 2nd Place */}
            {ranking[1] && (
              <div className="podium-card glass hover-lift podium-silver" style={{ animation: 'fadeUp 0.5s ease backwards 0.1s' }}>
                <div className="podium-avatar-wrap">
                  <div className="podium-avatar-silver">
                    {initials(ranking[1].name)}
                  </div>
                  <span className="podium-badge-silver">#2 PERAK</span>
                </div>
                <h3 className="podium-name">{ranking[1].name}</h3>
                <p className="podium-persona-silver">{personaLabel(ranking[1].persona)}</p>
                <div className="podium-xp-silver">
                  {ranking[1].xp.toLocaleString("id-ID")} XP
                </div>
              </div>
            )}

            {/* 1st Place */}
            {ranking[0] && (
              <div className="podium-card glass hover-lift podium-gold" style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards' }}>
                <div className="podium-avatar-wrap-gold">
                  <div className="podium-avatar-gold">
                    {initials(ranking[0].name)}
                  </div>
                  <span className="podium-crown">
                    <Trophy size={16} />
                  </span>
                  <span className="podium-badge-gold">#1 EMAS</span>
                </div>
                <h2 className="podium-name-gold">{ranking[0].name}</h2>
                <p className="podium-persona-gold">{personaLabel(ranking[0].persona)}</p>
                <div className="podium-xp-gold">
                  {ranking[0].xp.toLocaleString("id-ID")} XP
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {ranking[2] && (
              <div className="podium-card glass hover-lift podium-bronze" style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards 0.2s' }}>
                <div className="podium-avatar-wrap">
                  <div className="podium-avatar-bronze">
                    {initials(ranking[2].name)}
                  </div>
                  <span className="podium-badge-bronze">#3 PERUNGGU</span>
                </div>
                <h3 className="podium-name">{ranking[2].name}</h3>
                <p className="podium-persona-bronze">{personaLabel(ranking[2].persona)}</p>
                <div className="podium-xp-bronze">
                  {ranking[2].xp.toLocaleString("id-ID")} XP
                </div>
              </div>
            )}
          </section>
        )}

        <section className="leaderboard-list glass hover-lift leaderboard-container" style={{ marginTop: '2rem' }}>
          <div className="leaderboard-row leaderboard-head leaderboard-head-row">
            <span className="lb-col-rank">Peringkat</span>
            <span className="lb-col-user">Peserta</span>
            <span className="lb-col-persona">Profil</span>
            <span className="lb-col-badge">Penghargaan</span>
            <span className="lb-col-xp">XP</span>
          </div>
          {ranking.length === 0 && !loading ? (
            <div className="p-12 text-center text-muted" role="status">
              <Trophy size={42} className="mx-auto mb-3 opacity-40" />
              <h2 className="text-lg font-bold text-slate-700 m-0">Peringkat belum tersedia</h2>
              <p className="m-0 mt-1">Belum ada data untuk filter yang dipilih.</p>
            </div>
          ) : (
            ranking.map((student, index) => (
              <div 
                className={`leaderboard-row leaderboard-item-row ${student.id === user.id ? "is-current-user" : ""}`} 
                key={student.id}
                style={{ animation: `fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) backwards ${0.05 * Math.min(index, 15)}s` }}
              >
                <strong className={`lb-rank-num ${index < 3 ? "top-rank" : "normal-rank"}`}>{index + 1}</strong>
                <span className="leaderboard-person lb-col-user">
                  <i className="lb-user-avatar">{initials(student.name)}</i>
                  <b>
                    {student.name}
                    {student.id === user.id && <span className="current-user-badge">Anda</span>}
                  </b>
                </span>
                <span className="lb-col-persona">{personaLabel(student.persona)}</span>
                <span className="lb-col-badge">
                  {index === 0 && <span className="pro-ai-sparkle podium-nft-seal-sm">Peringkat #1</span>}
                  {student.badges?.map((badge) => (
                    <span key={badge.id} title={badge.name} className="lb-badge-pill">
                      {badge.name}
                    </span>
                  ))}
                  {(!student.badges || student.badges.length === 0) && index !== 0 && <span className="lb-badge-empty">—</span>}
                </span>
                <b className="lb-col-xp lb-xp-num">{student.xp.toLocaleString("id-ID")} XP</b>
              </div>
            ))
          )}
        </section>
      </div>
      
      <style>{`
        /* Leaderboard Animations & Custom UI Polish */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .leaderboard-filters-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .segmented-control {
          display: flex;
          background: rgba(255, 255, 255, 0.7);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
          backdrop-filter: blur(10px);
        }

        .segmented-btn {
          border: none;
          background: transparent;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .segmented-btn:hover {
          color: var(--text);
        }

        .segmented-btn.active {
          background: #fff;
          color: var(--teal-dark, #101519);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .filter-select-wrapper select.modern-select {
          appearance: none;
          padding: 10px 36px 10px 16px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E") no-repeat right 12px center;
          color: var(--text);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: border-color 0.2s;
        }

        .filter-select-wrapper select.modern-select:focus {
          outline: none;
          border-color: var(--teal, #2a6ba7);
        }

        /* Current User Highlight */
        .leaderboard-row.is-current-user {
          background: linear-gradient(90deg, #eff6ff, #ffffff) !important;
          border-left: 4px solid var(--teal, #2a6ba7) !important;
          box-shadow: 0 4px 12px rgba(42, 107, 167, 0.08);
          transform: scale(1.01);
          z-index: 2;
          position: relative;
        }

        .current-user-badge {
          background: var(--teal, #2a6ba7);
          color: #fff;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* Podium Polish */
        .podium-gold {
          position: relative;
          z-index: 3;
          border: 1px solid rgba(250, 204, 21, 0.4) !important;
          box-shadow: 0 20px 40px -10px rgba(250, 204, 21, 0.2) !important;
        }
        .podium-gold::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(250,204,21,0.5), transparent, rgba(250,204,21,0.5));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}
