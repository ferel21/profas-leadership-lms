import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { DashboardChrome } from "@/components/DashboardChrome";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initials, personaLabel } from "@/lib/utils";

export default async function LeaderboardPage(){
  const user=await getCurrentUser();
  if(!user)redirect("/masuk?next=/peringkat");
  const students=await prisma.user.findMany({where:{role:"STUDENT"},select:{id:true,name:true,persona:true,xpLogs:{select:{points:true}},userBadges:{include:{badge:true}}}});
  const ranking=students.map(student=>({...student,xp:student.xpLogs.reduce((sum,log)=>sum+log.points,0)})).sort((a,b)=>b.xp-a.xp);
  return (
    <DashboardChrome user={user}>
      <div className="leaderboard-heading">
        <span><Trophy/></span>
        <div>
          <p>PAPAN PERINGKAT</p>
          <h1>Pemimpin yang konsisten bertumbuh</h1>
          <small>XP berasal dari materi dan evaluasi yang berhasil diselesaikan.</small>
        </div>
      </div>

      {ranking.length > 0 && (
        <section className="podium-section" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", margin: "2.5rem 0 3.5rem", alignItems: "flex-end" }}>
          {/* 2nd Place */}
          {ranking[1] && (
            <div className="podium-card glass hover-lift" style={{ padding: "2rem 1.5rem", textAlign: "center", borderRadius: "24px", background: "linear-gradient(135deg, rgba(241,245,249,0.85), rgba(226,232,240,0.65))", border: "2px solid #cbd5e1", order: 1 }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "1rem" }}>
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#64748b", color: "white", display: "grid", placeItems: "center", fontSize: "1.5rem", fontWeight: "bold", margin: "0 auto", boxShadow: "0 8px 16px rgba(100,116,139,0.2)" }}>
                  {initials(ranking[1].name)}
                </div>
                <span style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", background: "#64748b", color: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 800 }}>#2 PERAK</span>
              </div>
              <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.125rem", color: "var(--ink)" }}>{ranking[1].name}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>{personaLabel(ranking[1].persona)}</p>
              <div style={{ marginTop: "1rem", padding: "0.5rem", background: "rgba(255,255,255,0.8)", borderRadius: "12px", fontWeight: "bold", color: "#334155" }}>
                {ranking[1].xp.toLocaleString("id-ID")} XP
              </div>
            </div>
          )}

          {/* 1st Place */}
          {ranking[0] && (
            <div className="podium-card glass hover-lift glow-gold" style={{ padding: "2.5rem 1.5rem", textAlign: "center", borderRadius: "28px", background: "linear-gradient(135deg, rgba(254,243,199,0.9), rgba(253,230,138,0.7))", border: "2px solid #f59e0b", order: 0, transform: "scale(1.05)", zIndex: 2 }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "1.25rem" }}>
                <div style={{ width: "86px", height: "86px", borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", display: "grid", placeItems: "center", fontSize: "1.75rem", fontWeight: "bold", margin: "0 auto", boxShadow: "0 10px 25px rgba(245,158,11,0.4)" }}>
                  {initials(ranking[0].name)}
                </div>
                <span style={{ position: "absolute", top: "-12px", right: "-8px", background: "#b45309", color: "white", padding: "4px", borderRadius: "50%", display: "grid", placeItems: "center", width: "28px", height: "28px", boxShadow: "0 4px 8px rgba(0,0,0,0.15)" }}>
                  <Trophy size={16} />
                </span>
                <span style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", background: "#d97706", color: "white", padding: "3px 14px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 800 }}>#1 EMAS</span>
              </div>
              <h2 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.35rem", color: "#78350f", fontWeight: 800 }}>{ranking[0].name}</h2>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#92400e" }}>{personaLabel(ranking[0].persona)}</p>
              <div style={{ marginBottom: "0.5rem" }}>
                <span className="pro-nft-seal" style={{ fontSize: "0.62rem", padding: "3px 10px" }}>👑 NFT VERIFIED CHAMPION</span>
              </div>
              <div style={{ marginTop: "0.75rem", padding: "0.6rem", background: "rgba(255,255,255,0.9)", borderRadius: "14px", fontWeight: 800, color: "#b45309", fontSize: "1.1rem" }}>
                {ranking[0].xp.toLocaleString("id-ID")} XP
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {ranking[2] && (
            <div className="podium-card glass hover-lift" style={{ padding: "2rem 1.5rem", textAlign: "center", borderRadius: "24px", background: "linear-gradient(135deg, rgba(254,237,232,0.85), rgba(253,216,200,0.65))", border: "2px solid #fdba74", order: 2 }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "1rem" }}>
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#c2410c", color: "white", display: "grid", placeItems: "center", fontSize: "1.5rem", fontWeight: "bold", margin: "0 auto", boxShadow: "0 8px 16px rgba(194,65,12,0.2)" }}>
                  {initials(ranking[2].name)}
                </div>
                <span style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", background: "#c2410c", color: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 800 }}>#3 PERUNGGU</span>
              </div>
              <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.125rem", color: "var(--ink)" }}>{ranking[2].name}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#9a3412" }}>{personaLabel(ranking[2].persona)}</p>
              <div style={{ marginTop: "1rem", padding: "0.5rem", background: "rgba(255,255,255,0.8)", borderRadius: "12px", fontWeight: "bold", color: "#7c2d12" }}>
                {ranking[2].xp.toLocaleString("id-ID")} XP
              </div>
            </div>
          )}
        </section>
      )}

      <section className="leaderboard-list glass hover-lift" style={{ borderRadius: "24px", padding: "1.5rem", background: "rgba(255,255,255,0.75)", border: "1px solid var(--line)" }}>
        <div className="leaderboard-row leaderboard-head" style={{ borderBottom: "2px solid var(--line)", paddingBottom: "1rem", marginBottom: "0.5rem" }}>
          <span style={{flex: "0 0 60px"}}>Peringkat</span>
          <span style={{flex: 1}}>Peserta</span>
          <span style={{flex: 1}}>Profil</span>
          <span style={{flex: 1}}>Penghargaan</span>
          <span style={{flex: "0 0 100px", textAlign: "right"}}>XP</span>
        </div>
        {ranking.map((student,index)=> (
          <div className={`leaderboard-row ${student.id===user.id?"me":""}`} key={student.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0", borderBottom: index !== ranking.length - 1 ? "1px dashed #e2e8f0" : "none" }}>
            <strong style={{flex: "0 0 60px", fontSize: "1.1rem", color: index < 3 ? "var(--color-primary)" : "#64748b"}}>{index+1}</strong>
            <span className="leaderboard-person" style={{flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <i style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#e0f2fe", color: "#0369a1", display: "grid", placeItems: "center", fontStyle: "normal", fontWeight: "bold" }}>{initials(student.name)}</i>
              <b>{student.id===user.id?`${student.name} (Anda)`:student.name}</b>
            </span>
            <span style={{flex: 1, color: "#475569"}}>{personaLabel(student.persona)}</span>
            <span style={{flex: 1, display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center"}}>
              {index === 0 && <span className="pro-ai-sparkle" style={{ fontSize: "0.62rem", padding: "2px 8px" }}>✨ Top 1 Champion</span>}
              {student.userBadges.map(ub => (
                <span key={ub.id} title={ub.badge.name} style={{ display: "inline-block", padding: "2px 8px", background: "#fef3c7", color: "#b45309", fontSize: "0.75rem", borderRadius: "12px", border: "1px solid #fde68a", fontWeight: 600 }}>
                  🏆 {ub.badge.name}
                </span>
              ))}
              {student.userBadges.length === 0 && index !== 0 && <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>—</span>}
            </span>
            <b style={{flex: "0 0 100px", textAlign: "right", color: "var(--color-primary)", fontSize: "1.05rem"}}>{student.xp.toLocaleString("id-ID")} XP</b>
          </div>
        ))}
      </section>
    </DashboardChrome>
  );
}
