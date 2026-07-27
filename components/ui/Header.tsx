import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, LogIn } from "lucide-react";
import { getCurrentUser } from "@/services/auth";
import { initials } from "@/utils";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

const navigation = [
  { href: "/program", label: "Program", prefetch: true },
  { href: "/#cara-belajar", label: "Cara belajar" },
  { href: "/#tentang", label: "Tentang" },
  { href: "/#insight", label: "Ruang kerja" },
  { href: "/#faq", label: "FAQ" },
];

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="site-header pf-site-header">
      <div className="container nav-wrap pf-header__inner">
        <div className="pf-header__identity">
          <Logo />
          <span className="pf-header__compass" aria-hidden="true">
            <Compass size={17} strokeWidth={1.8} />
          </span>
        </div>

        <nav className="desktop-nav pf-header__nav" aria-label="Navigasi utama">
          {navigation.map(item => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.prefetch}
              className="pf-header__nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions pf-header__actions">
          {user ? (
            <Link
              href="/dashboard"
              prefetch={true}
              className="user-chip pf-header__user"
              aria-label="Buka dashboard"
            >
              <span className={`pf-header__avatar ${user.avatar ? "has-avatar" : ""}`}>
                {user.avatar ? (
                  <Image src={user.avatar} alt="" width={33} height={33} />
                ) : (
                  initials(user.name)
                )}
              </span>
              <b className="pf-header__user-name">
                {user.username ? `@${user.username}` : user.name.split(" ")[0]}
              </b>
              <ArrowRight className="pf-header__user-arrow" size={16} aria-hidden="true" />
            </Link>
          ) : (
            <div className="pf-header__guest-actions">
              <Link href="/masuk" prefetch={true} className="nav-login pf-header__login">
                <LogIn size={16} aria-hidden="true" />
                <span>Masuk</span>
              </Link>
              <Link
                href="/daftar"
                prefetch={true}
                className="btn btn-primary btn-small pf-header__cta"
              >
                <span>Mulai Belajar</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
          <MobileMenu signedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
