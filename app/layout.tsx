import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { RouteProgressBar } from "@/components/RouteProgressBar";
import "./typography.css";
import "./design-system.css";
import "./master.css";
import "./landing.css";
import "./premium.css";
import "./pro-lms.css";
import "./enterprise-lms.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  metadataBase: new URL("https://profas-leadership-lms.netlify.app"),
  title: {
    template: "%s | PROFAS Leadership",
    default: "PROFAS Leadership — Tumbuh untuk Berdampak",
  },
  description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
  openGraph: {
    title: "PROFAS Leadership — Tumbuh untuk Berdampak",
    description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
    url: "https://profas-leadership-lms.netlify.app",
    siteName: "PROFAS Leadership",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
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
      <body className={nunito.className}>
        <RouteProgressBar />
        {children}
      </body>
    </html>
  );
}
