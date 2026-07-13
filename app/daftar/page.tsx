import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export default function RegisterPage() { return <main className="auth-page register-page"><section className="auth-visual"><Image src="/images/profas-leadership-hero.webp" alt="Kelas PROFAS" fill priority/><div><Logo/><h2>Tumbuh sebagai pemimpin.<br/>Mulai dari sini.</h2><ul><li><CheckCircle2/> Akses jalur belajar personal</li><li><CheckCircle2/> Ukur pertumbuhan kompetensi</li><li><CheckCircle2/> Raih sertifikat terverifikasi</li></ul></div></section><section className="auth-panel"><div className="mobile-auth-logo"><Logo/></div><div className="auth-card"><span className="eyebrow">BUAT AKUN PROFAS</span><h1>Langkah pertama menuju<br/><em>dampak yang lebih besar.</em></h1><p>Pilih profil yang paling sesuai dengan Anda.</p><AuthForm mode="register"/><small className="auth-switch">Sudah punya akun? <Link href="/masuk">Masuk</Link></small></div></section></main>; }
