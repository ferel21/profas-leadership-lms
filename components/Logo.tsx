import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="PROFAS Leadership">
      <span className="logo-mark"><i /><i /><i /></span>
      {!compact && <span><b>PROFAS</b><small>LEADERSHIP</small></span>}
    </Link>
  );
}
