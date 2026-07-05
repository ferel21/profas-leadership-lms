import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export default async function LoginPage({searchParams}:{searchParams:Promise<{next?:string}>}) { const {next}=await searchParams;const redirectTo=next?.startsWith("/")&&!next.startsWith("//")?next:"/dashboard";return <main className="auth-page"><section className="auth-visual"><Image src="/images/profas-leadership-hero.png" alt="Kelas PROFAS" fill priority/><div><Logo/><blockquote>“Perubahan besar selalu dimulai dari keberanian untuk belajar.”</blockquote><p>PROFAS Leadership</p></div></section><section className="auth-panel"><div className="mobile-auth-logo"><Logo/></div><div className="auth-card"><span className="eyebrow">SELAMAT DATANG KEMBALI</span><h1>Lanjutkan perjalanan<br/><em>kepemimpinan Anda.</em></h1><p>Masuk untuk mengakses program dan progres belajar.</p><AuthForm mode="login" redirectTo={redirectTo}/><small className="auth-switch">Belum punya akun? <Link href="/daftar">Daftar gratis</Link></small></div></section></main>; }
