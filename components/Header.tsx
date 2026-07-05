import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <nav className="desktop-nav" aria-label="Navigasi utama">
          <Link href="/#tentang">Tentang</Link>
          <Link href="/program">Program</Link>
          <Link href="/#mentor">Mentor</Link>
          <Link href="/#insight">Insight</Link>
        </nav>
        <div className="nav-actions">
          {user ? (
            <Link href="/dashboard" className="user-chip"><span className={user.avatar ? "has-avatar" : ""}>{user.avatar ? <Image src={user.avatar} alt="" width={33} height={33} /> : initials(user.name)}</span>{user.username ? `@${user.username}` : user.name.split(" ")[0]}</Link>
          ) : (
            <><Link href="/masuk" className="nav-login">Masuk</Link><Link href="/daftar" className="btn btn-primary btn-small">Mulai Belajar</Link></>
          )}
          <MobileMenu signedIn={!!user}/>
        </div>
      </div>
    </header>
  );
}
