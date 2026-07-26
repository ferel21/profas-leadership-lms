import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { GlobalLeafStagger } from "@/components/ui/GlobalLeafStagger";
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

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
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
      <body className={`${inter.variable} font-sans`} style={{ fontFamily: 'var(--font-inter, "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, sans-serif)' }}>
        <RouteProgressBar />
        <GlobalLeafStagger />
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
