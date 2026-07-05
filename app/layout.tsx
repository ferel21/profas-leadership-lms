import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./typography.css";
import "./master.css";
import "./landing.css";
import "./premium.css";
import "./pro-lms.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: {
    template: "%s | PROFAS Leadership",
    default: "PROFAS Leadership — Tumbuh untuk Berdampak",
  },
  description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
  openGraph: {
    title: "PROFAS Leadership — Tumbuh untuk Berdampak",
    description: "Platform pelatihan kepemimpinan terstruktur untuk individu, UMKM, akademisi, organisasi, dan koperasi.",
    url: "https://profas-leadership.com",
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
  return <html lang="id"><body className={nunito.className}>{children}</body></html>;
}
