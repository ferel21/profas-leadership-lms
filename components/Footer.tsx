import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand"><Logo /><p>Menumbuhkan pemimpin yang sadar, tangguh, dan berdampak bagi Indonesia.</p><div className="socials"><span><Instagram size={18}/></span><span><Linkedin size={18}/></span></div></div>
        <div><h4>Jelajahi</h4><Link href="/program">Program</Link><Link href="/#mentor">Mentor</Link></div>
        <div><h4>Dukungan</h4><a href="mailto:halo@profas.id?subject=Bantuan%20PROFAS">Pusat Bantuan</a><Link href="/privasi">Kebijakan Privasi</Link><Link href="/syarat">Syarat & Ketentuan</Link></div>
        <div><h4>Hubungi Kami</h4><p className="footer-contact"><Mail size={17}/> halo@profas.id</p><p className="footer-contact"><MapPin size={17}/> Makassar, Indonesia</p></div>
      </div>
      <div className="container footer-bottom">© 2026 PROFAS Leadership. Tumbuh untuk berdampak.<span>Bahasa Indonesia</span></div>
    </footer>
  );
}
