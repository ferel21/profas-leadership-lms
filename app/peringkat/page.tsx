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
      <section className="leaderboard-list">
        <div className="leaderboard-row leaderboard-head">
          <span style={{flex: "0 0 60px"}}>Peringkat</span>
          <span style={{flex: 1}}>Peserta</span>
          <span style={{flex: 1}}>Profil</span>
          <span style={{flex: 1}}>Penghargaan</span>
          <span style={{flex: "0 0 100px", textAlign: "right"}}>XP</span>
        </div>
        {ranking.map((student,index)=> (
          <div className={`leaderboard-row ${student.id===user.id?"me":""}`} key={student.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <strong style={{flex: "0 0 60px"}}>{index+1}</strong>
            <span className="leaderboard-person" style={{flex: 1}}>
              <i>{initials(student.name)}</i>
              <b>{student.id===user.id?`${student.name} (Anda)`:student.name}</b>
            </span>
            <span style={{flex: 1}}>{personaLabel(student.persona)}</span>
            <span style={{flex: 1, display: "flex", gap: "0.25rem", flexWrap: "wrap"}}>
              {student.userBadges.map(ub => (
                <span key={ub.id} title={ub.badge.name} style={{ display: "inline-block", padding: "2px 8px", background: "#fef3c7", color: "#b45309", fontSize: "0.75rem", borderRadius: "12px", border: "1px solid #fde68a" }}>
                  {ub.badge.name}
                </span>
              ))}
              {student.userBadges.length === 0 && <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>—</span>}
            </span>
            <b style={{flex: "0 0 100px", textAlign: "right"}}>{student.xp.toLocaleString("id-ID")} XP</b>
          </div>
        ))}
      </section>
    </DashboardChrome>
  );
}
