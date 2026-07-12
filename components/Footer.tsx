import Link from 'next/link';
import { Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Menumbuhkan pemimpin yang sadar, tangguh, dan berdampak bagi Indonesia.</p>
          <div className="socials">
            <a href="https://instagram.com/profas.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://linkedin.com/company/profas" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>
        </div>
        <div>
          <h4>Program</h4>
          <Link href="/program">Katalog Program</Link>
          <Link href="/#mentor">Mentor</Link>
          <Link href="/#tentang">Tentang LMS</Link>
        </div>
        <div>
          <h4>Dukungan</h4>
          <a href="mailto:halo@profas.id?subject=Bantuan%20PROFAS">Pusat Bantuan</a>
          <Link href="/privasi">Kebijakan Privasi</Link>
          <Link href="/syarat">Syarat &amp; Ketentuan</Link>
        </div>
        <div>
          <h4>Hubungi Kami</h4>
          <p className="footer-contact"><Mail size={17} /> halo@profas.id</p>
          <p className="footer-contact"><Phone size={17} /> +62 812-3456-7890</p>
          <p className="footer-contact"><MapPin size={17} /> Makassar, Indonesia</p>
        </div>
      </div>
      <div className="container footer-bottom">© 2026 PROFAS Leadership. Tumbuh untuk berdampak.<span>Bahasa Indonesia</span></div>
    </footer>
  );
}
