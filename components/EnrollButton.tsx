"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";

export function EnrollButton({ courseId, slug, signedIn, enrolled = false }: { courseId: string; slug: string; signedIn: boolean; enrolled?: boolean }) {
  const [loading, setLoading] = useState(false); const router = useRouter();
  async function enroll() { if (!signedIn) { router.push(`/masuk?next=${encodeURIComponent(`/program/${slug}`)}`); return; } if (enrolled) { router.push(`/belajar/${slug}`); return; } setLoading(true); try { const response = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enroll", courseId }) }); if (response.ok) router.push(`/belajar/${slug}`); else setLoading(false); } catch { setLoading(false); } }
  return <button className="btn btn-primary enroll-button" onClick={enroll} disabled={loading}>{loading?<LoaderCircle className="spin"/>:<>{enrolled?"Lanjutkan Belajar":"Mulai Program"} <ArrowRight/></>}</button>;
}
