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
        <section className="podium-grid">
          {/* 2nd Place */}
          {ranking[1] && (
            <div className="podium-card glass hover-lift podium-silver">
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
            <div className="podium-card glass hover-lift glow-gold podium-gold">
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
              <div className="podium-nft-mb">
                <span className="pro-nft-seal podium-nft-seal-sm">👑 NFT VERIFIED CHAMPION</span>
              </div>
              <div className="podium-xp-gold">
                {ranking[0].xp.toLocaleString("id-ID")} XP
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {ranking[2] && (
            <div className="podium-card glass hover-lift podium-bronze">
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

      <section className="leaderboard-list glass hover-lift leaderboard-container">
        <div className="leaderboard-row leaderboard-head leaderboard-head-row">
          <span className="lb-col-rank">Peringkat</span>
          <span className="lb-col-user">Peserta</span>
          <span className="lb-col-persona">Profil</span>
          <span className="lb-col-badge">Penghargaan</span>
          <span className="lb-col-xp">XP</span>
        </div>
        {ranking.map((student, index) => (
          <div className={`leaderboard-row leaderboard-item-row ${student.id === user.id ? "me" : ""}`} key={student.id}>
            <strong className={`lb-rank-num ${index < 3 ? "top-rank" : "normal-rank"}`}>{index + 1}</strong>
            <span className="leaderboard-person lb-col-user">
              <i className="lb-user-avatar">{initials(student.name)}</i>
              <b>{student.id === user.id ? `${student.name} (Anda)` : student.name}</b>
            </span>
            <span className="lb-col-persona">{personaLabel(student.persona)}</span>
            <span className="lb-col-badge">
              {index === 0 && <span className="pro-ai-sparkle podium-nft-seal-sm">✨ Top 1 Champion</span>}
              {student.userBadges.map(ub => (
                <span key={ub.id} title={ub.badge.name} className="lb-badge-pill">
                  🏆 {ub.badge.name}
                </span>
              ))}
              {student.userBadges.length === 0 && index !== 0 && <span className="lb-badge-empty">—</span>}
            </span>
            <b className="lb-col-xp lb-xp-num">{student.xp.toLocaleString("id-ID")} XP</b>
          </div>
        ))}
      </section>
    </DashboardChrome>
  );
}
