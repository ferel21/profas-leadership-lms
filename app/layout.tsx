import type { Metadata } from "next";
import { Inter, Fraunces, Space_Grotesk } from 'next/font/google';
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { WebVitalsReporter } from "@/components/ui/WebVitalsReporter";
import "@/styles/typography.css";
import "@/styles/design-system.css";
import "@/styles/master.css";

import "@/styles/premium.css";
import "@/styles/pro-lms.css";
import "@/styles/enterprise-lms.css";
import "@/styles/taste.css";
import "@/styles/lms-fresh.css";
import "@/styles/akseslegal-theme.css";
import "@/styles/home-landing.css";
import "@/styles/leaf-stagger.css";
import "@/styles/home-scroll.css";
import "@/styles/profas-reframe.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// preload: false — Fraunces and Space Grotesk are route-specific display faces
// applied through CSS variables, so Next cannot tell which route uses them and
// preloads both on every page. /masuk renders Inter only, yet was downloading
// all four font files. They now load on demand, when a page actually uses them.
// Weights track what the CSS actually authors. 700 is used by
// .certificate-paper h2 (the recipient's name); without it loaded the browser
// resolved 700 up to 900. 900 is authored nowhere and was only ever reached as
// that fallback, so it is dropped -- the file count is unchanged.
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '600', '700'], style: ['normal', 'italic'], variable: '--font-fraunces', display: 'swap', preload: false });
// NOT adding 600 here, though .al-float-card--ledger small authors it and the
// browser resolves it up to 700: rendering both ways was measured at 115.77px vs
// 115.75px, so an extra font file buys a 0.02px difference. Left as-is.
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-space', display: 'swap', preload: false });
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://profas-leadership-lms.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    template: "%s | PROFAS Leadership",
    default: "PROFAS Leadership — Tumbuh untuk Berdampak",
  },
  description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
  keywords: ["kepemimpinan", "pelatihan kepemimpinan", "LMS", "leadership", "pengembangan diri", "PROFAS", "manajemen", "eksekutif"],
  authors: [{ name: "PROFAS Leadership" }],
  creator: "PROFAS Leadership",
  publisher: "PROFAS Leadership",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "PROFAS Leadership — Tumbuh untuk Berdampak",
    description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
    url: appUrl,
    siteName: "PROFAS Leadership",
    images: [
      { url: "/images/profas-activity-collage.jpeg", width: 1599, height: 899, alt: "Kegiatan Pembelajaran PROFAS Leadership" },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PROFAS Leadership — Tumbuh untuk Berdampak",
    description: "Platform pelatihan kepemimpinan terstruktur untuk mencetak pemimpin berdampak.",
    images: ["/images/profas-activity-collage.jpeg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "PROFAS Leadership",
  "url": appUrl,
  "logo": `${appUrl}/icon.svg`,
  "description": "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
  "sameAs": [
    "https://www.linkedin.com/company/profas",
    "https://www.instagram.com/profas"
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} ${spaceGrotesk.variable} font-sans`}>
        <RouteProgressBar />
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
