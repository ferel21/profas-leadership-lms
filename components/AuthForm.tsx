"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

export function AuthForm({ 
  mode, 
  redirectTo = "/dashboard", 
  errorParam, 
  reasonParam 
}: { 
  mode: "login" | "register"; 
  redirectTo?: string; 
  errorParam?: string; 
  reasonParam?: string; 
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [persona, setPersona] = useState("STUDENT_ENTREPRENEUR");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const body:Record<string,FormDataEntryValue|boolean> = Object.fromEntries(form.entries());
    if (mode === "register") body.persona = persona;
    if (mode === "login") body.remember = form.get("remember") === "on";
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) { setError(result.message); setLoading(false); return; }
      router.push(redirectTo.startsWith("/")&&!redirectTo.startsWith("//")?redirectTo:"/dashboard"); router.refresh();
    } catch { setError("Koneksi bermasalah. Periksa jaringan lalu coba lagi."); setLoading(false); }
  }

  const demo = (email: string) => { 
    const input = document.querySelector<HTMLInputElement>('input[name="email"]'); 
    const pass = document.querySelector<HTMLInputElement>('input[name="password"]'); 
    if (input && pass) { input.value = email; pass.value = "profas123"; } 
  };

  return <form onSubmit={submit} className="auth-form">
    {(errorParam || error) && (
      <div className="auth-alert-box">
        <div className="auth-alert-header">
          <span>⚠️ Gagal Masuk / Otorisasi Google</span>
        </div>
        <div>
          {reasonParam || error || "Terjadi kendala saat verifikasi akun Anda."}
        </div>
        {errorParam === "token_exchange_failed" && (
          <div className="auth-alert-codebox">
            <b>💡 Solusi Konfigurasi Google Console &amp; Vercel:</b><br/>
            1. Pastikan di Dasbor Vercel tidak ada spasi/enter tambahan pada nilai <code>GOOGLE_CLIENT_ID</code> &amp; <code>GOOGLE_CLIENT_SECRET</code>.<br/>
            2. Pastikan di Google Cloud Console (&rarr; APIs &amp; Services &rarr; Credentials), pada bagian <b>Authorized redirect URIs</b>, sudah ditambahkan URL berikut secara persis:<br/>
            <code className="auth-code-pill">https://profas-leadership-lms.vercel.app/api/auth/callback/google</code>
          </div>
        )}
      </div>
    )}

    <a href="/api/auth/google" className="auth-btn-google hover-lift">
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {mode === "login" ? "Masuk dengan Google" : "Daftar dengan Google"}
    </a>
    <div className="auth-divider-row">
      <div className="auth-divider-line"></div>
      <span className="auth-divider-text">atau dengan email</span>
      <div className="auth-divider-line"></div>
    </div>

    {mode === "register" && <><label>Nama lengkap<input name="name" placeholder="Nama Anda" required minLength={3} maxLength={80}/></label><label>Nama akun<input name="username" placeholder="contoh: nadia.pratama" required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9._-]*[a-z0-9]" title="Gunakan huruf kecil, angka, titik, garis bawah, atau tanda hubung." autoCapitalize="none"/></label><div className="persona-select"><span>Saya adalah</span><div>{[["STUDENT_ENTREPRENEUR","Pengusaha / Pelajar"],["ACADEMIC","Akademisi"],["ORGANIZATION","Organisasi"],["COOPERATIVE","Koperasi"]].map(([value,label])=><button type="button" key={value} onClick={()=>setPersona(value)} className={persona===value?"active":""}>{label}</button>)}</div></div></>}
    <label>Email<input name="email" type="email" placeholder="nama@email.com" required/></label>
    <label>Kata sandi<div className="password-input"><input name="password" type={show?"text":"password"} placeholder={mode==="login"?"Masukkan kata sandi":"Minimal 8 karakter"} required minLength={mode==="login"?6:8}/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
    {mode === "login" && <div className="form-row"><label className="remember"><input name="remember" type="checkbox"/> Ingat saya</label><Link href="mailto:halo@profas.id?subject=Bantuan%20kata%20sandi%20PROFAS">Lupa kata sandi?</Link></div>}
    <button className="btn btn-primary auth-submit auth-submit-mt hover-lift" disabled={loading}>{loading?<LoaderCircle className="spin"/>:<>{mode==="login"?"Masuk ke Dashboard":"Buat Akun Gratis"}<ArrowRight/></>}</button>
    {mode === "login" && <div className="demo-box auth-demo-mt"><b>Akun demo</b><div><button type="button" onClick={()=>demo("peserta@profas.id")}>Peserta</button><button type="button" onClick={()=>demo("mentor@profas.id")}>Mentor</button><button type="button" onClick={()=>demo("admin@profas.id")}>Admin</button></div><small>Kata sandi semua akun: profas123</small></div>}
  </form>;
}
