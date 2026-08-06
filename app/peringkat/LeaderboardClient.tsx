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
        <span><Trophy /></span>
        <div>
          <p>PAPAN PERINGKAT</p>
          <h1>Pemimpin yang konsisten bertumbuh</h1>
          <small>XP berasal dari materi dan evaluasi yang berhasil diselesaikan.</small>
        </div>
      </div>

      <div className="leaderboard-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="filter-group" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.5)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
          <button 
            type="button"
            onClick={() => setTimeframe("all")} 
            className={`btn btn-small ${timeframe === "all" ? "btn-primary" : "btn-ghost"}`}
          >
            Semua Waktu
          </button>
          <button 
            type="button"
            onClick={() => setTimeframe("monthly")} 
            className={`btn btn-small ${timeframe === "monthly" ? "btn-primary" : "btn-ghost"}`}
          >
            Bulan Ini
          </button>
          <button 
            type="button"
            onClick={() => setTimeframe("weekly")} 
            className={`btn btn-small ${timeframe === "weekly" ? "btn-primary" : "btn-ghost"}`}
          >
            Minggu Ini
          </button>
        </div>

        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="persona-filter" className="sr-only">Filter Profil</label>
          <select 
            id="persona-filter" 
            value={personaFilter} 
            onChange={(e) => setPersonaFilter(e.target.value as Persona | "ALL")}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '0.875rem' }}
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
              <div className="podium-card glass hover-lift glow-gold podium-gold" style={{ animation: 'fadeUp 0.5s ease backwards' }}>
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
              <div className="podium-card glass hover-lift podium-bronze" style={{ animation: 'fadeUp 0.5s ease backwards 0.2s' }}>
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
                className={`leaderboard-row leaderboard-item-row ${student.id === user.id ? "me" : ""}`} 
                key={student.id}
                style={{ animation: `fadeUp 0.3s ease backwards ${0.1 * Math.min(index, 10)}s` }}
              >
                <strong className={`lb-rank-num ${index < 3 ? "top-rank" : "normal-rank"}`}>{index + 1}</strong>
                <span className="leaderboard-person lb-col-user">
                  <i className="lb-user-avatar">{initials(student.name)}</i>
                  <b>{student.id === user.id ? `${student.name} (Anda)` : student.name}</b>
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
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
