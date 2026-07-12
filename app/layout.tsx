import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import { RouteProgressBar } from "@/components/RouteProgressBar";
import "./typography.css";
import "./design-system.css";
import "./master.css";

import "./premium.css";
import "./pro-lms.css";
import "./enterprise-lms.css";
import "./taste.css";
import "./lms-fresh.css";
import './akseslegal-theme.css';
import './home-landing.css';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', weight: ['400', '500', '600', '700', '800'] });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading', weight: ['400', '500', '600', '700', '800', '900'] });
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://profas-leadership-lms.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    template: "%s | PROFAS Leadership",
    default: "PROFAS Leadership — Tumbuh untuk Berdampak",
  },
  description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
  openGraph: {
    title: "PROFAS Leadership — Tumbuh untuk Berdampak",
    description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
    url: appUrl,
    siteName: "PROFAS Leadership",
    images: [
      { url: "/images/profas-activity-collage.jpeg", width: 1599, height: 899 },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://aws-1-ap-southeast-2.pooler.supabase.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://aws-1-ap-southeast-2.pooler.supabase.com" />
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} font-sans`} style={{ fontFamily: 'var(--font-display), sans-serif' }}>
        <RouteProgressBar />
        {children}
      </body>
    </html>
  );
}
