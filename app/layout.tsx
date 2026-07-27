import type { Metadata } from "next";
import { Inter, Fraunces, Space_Grotesk } from "next/font/google";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space",
  display: "swap",
  preload: false,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://profas-leadership-lms.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    template: "%s | PROFAS",
    default: "PROFAS — Kepastian Hukum untuk Keputusan Bisnis",
  },
  description:
    "Pendampingan hukum bisnis untuk legalitas, kontrak, ketenagakerjaan, tata kelola, dan risiko—disampaikan dengan jernih dan terukur.",
  keywords: [
    "penasihat hukum bisnis",
    "legal corporate Indonesia",
    "kontrak bisnis",
    "perizinan usaha",
    "ketenagakerjaan",
    "tata kelola",
    "PROFAS",
  ],
  authors: [{ name: "PROFAS" }],
  creator: "PROFAS",
  publisher: "PROFAS",
  icons: { icon: "/icon.svg" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "PROFAS — Kepastian Hukum untuk Keputusan Bisnis",
    description: "Dari konteks yang rumit menuju keputusan yang dapat dipertanggungjawabkan.",
    url: appUrl,
    siteName: "PROFAS",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PROFAS — Kepastian Hukum untuk Keputusan Bisnis",
    description: "Dari konteks yang rumit menuju keputusan yang dapat dipertanggungjawabkan.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "PROFAS",
  url: appUrl,
  logo: `${appUrl}/icon.svg`,
  email: "halo@profas.id",
  areaServed: { "@type": "Country", name: "Indonesia" },
  description:
    "Pendampingan hukum bisnis untuk legalitas, kontrak, ketenagakerjaan, tata kelola, dan risiko.",
  serviceType: [
    "Corporate and Commercial",
    "Business Licensing",
    "Contract Review",
    "Employment Law",
    "Risk and Dispute Advisory",
  ],
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
      <body
        className={`${inter.variable} ${fraunces.variable} ${spaceGrotesk.variable} font-sans`}
        style={{ fontFamily: 'var(--font-inter, "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)' }}
      >
        <RouteProgressBar />
        <GlobalLeafStagger />
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
