import Link from 'next/link';
import { ArrowUpRight, Compass, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="footer pf-footer">
      <div className="container footer-grid pf-footer__grid">
        <div className="footer-brand pf-footer__brand">
          <div className="pf-footer__brand-lockup">
            <Logo />
            <span className="pf-footer__compass" aria-hidden="true">
              <Compass size={18} strokeWidth={1.8} />
            </span>
          </div>
          <p>Menumbuhkan pemimpin yang sadar, tangguh, dan berdampak bagi Indonesia.</p>
          <nav
            className="socials pf-footer__socials"
            aria-label="Media sosial PROFAS"
          >
            <a href="https://instagram.com/profas.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={18} aria-hidden="true" />
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
            <a href="https://linkedin.com/company/profas" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={18} aria-hidden="true" />
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </nav>
        </div>

        <div
          className="pf-footer__column"
          role="navigation"
          aria-labelledby="footer-program"
        >
          <h2 id="footer-program">Program</h2>
          <Link href="/program">Katalog Program</Link>
          <Link href="/#mentor">Mentor</Link>
          <Link href="/#tentang">Tentang LMS</Link>
        </div>

        <div
          className="pf-footer__column"
          role="navigation"
          aria-labelledby="footer-support"
        >
          <h2 id="footer-support">Dukungan</h2>
          <a href="mailto:halo@profas.id?subject=Bantuan%20PROFAS">Pusat Bantuan</a>
          <Link href="/#faq">FAQ</Link>
          <Link href="/verifikasi">Verifikasi Sertifikat</Link>
          <Link href="/privasi">Kebijakan Privasi</Link>
          <Link href="/syarat">Syarat &amp; Ketentuan</Link>
        </div>

        <div
          className="pf-footer__column pf-footer__contact-column"
          role="group"
          aria-labelledby="footer-contact"
        >
          <h2 id="footer-contact">Hubungi Kami</h2>
          <a className="footer-contact" href="mailto:halo@profas.id">
            <Mail size={17} aria-hidden="true" />
            <span>halo@profas.id</span>
          </a>
          <a className="footer-contact" href="tel:+6281234567890">
            <Phone size={17} aria-hidden="true" />
            <span>+62 812-3456-7890</span>
          </a>
          <p className="footer-contact">
            <MapPin size={17} aria-hidden="true" />
            <span>Makassar, Indonesia</span>
          </p>
        </div>
      </div>

      <div className="container footer-bottom pf-footer__bottom">
        <p>© 2026 PROFAS Leadership. Tumbuh untuk berdampak.</p>
        <span lang="id">Bahasa Indonesia</span>
      </div>
    </footer>
  );
}
