import Link from "next/link";
import Image from "next/image";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`logo ${compact ? "logo-compact" : ""}`} aria-label="PROFAS Leadership" style={{ display: 'inline-block', maxWidth: '100%' }}>
      <Image
        className="logo-image"
        src="/images/profas-logo.webp"
        alt="PROFAS Leadership"
        width={2453}
        height={673}
        sizes={compact ? "42px" : "190px"}
        priority={!compact}
        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
      />
    </Link>
  );
}
