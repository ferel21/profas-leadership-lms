"use client";

import { useMemo } from "react";
import { TrendingUp, Award, Minus } from "lucide-react";

type Attempt = {
  score: number;
  assessment: {
    courseId: string;
    title: string;
    type: string;
  };
};

export function PrePostTestComparison({ attempts }: { attempts: Attempt[] }) {
  const comparisonData = useMemo(() => {
    // Group attempts by course
    const courseMap = new Map<string, { title: string; pre: number | null; post: number | null }>();
    
    // attempts array is already sorted descending by submittedAt
    // so we keep the first seen attempt (latest attempt) for each type
    for (const attempt of attempts) {
      const cid = attempt.assessment.courseId;
      if (!courseMap.has(cid)) {
        courseMap.set(cid, { title: attempt.assessment.title, pre: null, post: null });
      }
      
      const entry = courseMap.get(cid)!;
      if (attempt.assessment.type === "PRETEST" && entry.pre === null) {
        entry.pre = attempt.score;
      } else if (attempt.assessment.type === "POSTTEST" && entry.post === null) {
        entry.post = attempt.score;
      }
    }

    return Array.from(courseMap.values()).filter(c => c.pre !== null || c.post !== null);
  }, [attempts]);

  if (comparisonData.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="prepost-comparison-title">
      <header className="pf-student-section-heading">
        <div>
          <span>Evaluasi Pembelajaran</span>
          <h2 id="prepost-comparison-title">Peningkatan Kompetensi</h2>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comparisonData.map((data, i) => {
          const hasBoth = data.pre !== null && data.post !== null;
          const improvement = hasBoth ? (data.post! - data.pre!) : null;
          const isPositive = improvement && improvement > 0;
          
          return (
            <div key={i} className="data-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-4 leading-tight">{data.title.replace("Kuis:", "").replace("Evaluasi:", "").trim()}</h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pre-Test</p>
                    <span className="text-2xl font-extrabold text-blue-600">{data.pre !== null ? data.pre : "-"}</span>
                  </div>
                  
                  <div className="h-0.5 flex-1 mx-4 bg-slate-100 relative">
                    {hasBoth && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                        <TrendingUp size={16} className={isPositive ? "text-emerald-500" : "text-slate-300"} />
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Post-Test</p>
                    <span className="text-2xl font-extrabold text-emerald-600">{data.post !== null ? data.post : "-"}</span>
                  </div>
                </div>
              </div>
              
              <div className={`mt-2 p-3 rounded-xl flex items-center justify-between ${hasBoth && isPositive ? "bg-emerald-50" : "bg-slate-50"}`}>
                <span className={`text-sm font-semibold ${hasBoth && isPositive ? "text-emerald-800" : "text-slate-600"}`}>
                  {hasBoth ? "Peningkatan Skor" : "Status Evaluasi"}
                </span>
                <span className={`text-sm font-bold flex items-center gap-1 ${hasBoth && isPositive ? "text-emerald-600" : "text-slate-500"}`}>
                  {hasBoth ? (
                    <>
                      {isPositive ? "+" : ""}{improvement} Poin
                      {isPositive && <Award size={16} />}
                    </>
                  ) : (
                    <span className="flex items-center gap-1"><Minus size={14}/> Belum lengkap</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
