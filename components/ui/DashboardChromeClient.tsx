"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpen, Check, ClipboardCheck, Gauge, LogOut, Menu, X, History, Users, FileCheck2, Calendar, MessageSquare, Settings, PieChart, Search, Trophy, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { initials } from "@/utils";
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("./CommandPalette").then(m => ({ default: m.CommandPalette })), { ssr: false });
const ExecutiveExportHubModal = dynamic(() => import("@/components/shared/ExecutiveExportHubModal").then(m => ({ default: m.ExecutiveExportHubModal })), { ssr: false });

type UserShape = { name:string;username?:string|null;email:string;role:string;avatar?:string|null;headline?:string|null };
type NotificationItem = { id: string; title: string; message: string; read: boolean; link: string | null; createdAt: string };
type NavItem = readonly [label: string, icon: LucideIcon, href: string];
type NavSection = { readonly label: string; readonly items: readonly NavItem[] };
type NotificationCache = { time: number; notifs: NotificationItem[]; unreadCount: number };
type NotificationCacheGlobal = typeof globalThis & { __profasNotifCache?: Record<string, NotificationCache> };

const studentNavSections = [
  { label: "Belajar", items: [["Ringkasan", BookOpen, "/dashboard"], ["Riwayat", History, "/riwayat"], ["Kalender", Calendar, "/kalender"]] },
  {
    label: "Aktivitas",
    items: [
      ["Absensi", ClipboardCheck, "/absensi"],
      ["Peringkat", Trophy, "/peringkat"],
      ["Komunitas", MessageSquare, "/forum"],
    ],
  },
  { label: "Akun", items: [["Pengaturan", Settings, "/pengaturan"]] },
] as const satisfies readonly NavSection[];

const mentorNavSections = [
  { label: "Workspace", items: [["Ringkasan", Gauge, "/dashboard"], ["Program & Materi", BookOpen, "/dashboard#program"]] },
  { label: "Peserta & evaluasi", items: [["Manajemen Peserta", Users, "/dashboard/peserta"], ["Evaluasi", FileCheck2, "/mentor/evaluasi"]] },
  { label: "Operasional", items: [["Kalender", Calendar, "/kalender"], ["Absensi", ClipboardCheck, "/absensi"]] },
  { label: "Wawasan & komunitas", items: [["Analitik", PieChart, "/dashboard/analitik"], ["Peringkat", Trophy, "/peringkat"], ["Komunitas", MessageSquare, "/forum"]] },
  { label: "Akun", items: [["Pengaturan", Settings, "/pengaturan"]] },
] as const satisfies readonly NavSection[];

const adminNavSections = [
  { label: "Workspace", items: [["Ringkasan", Gauge, "/dashboard"]] },
  { label: "Kelola platform", items: [["Pengguna", Users, "/dashboard#admin-user-mgmt"], ["Program", BookOpen, "/dashboard#program"], ["Siaran", Megaphone, "/dashboard#broadcast-mgmt"]] },
  { label: "Operasional", items: [["Kalender", Calendar, "/kalender"], ["Absensi", ClipboardCheck, "/absensi"]] },
  { label: "Wawasan & komunitas", items: [["Analitik", PieChart, "/dashboard/analitik"], ["Peringkat", Trophy, "/peringkat"], ["Komunitas", MessageSquare, "/forum"]] },
  { label: "Akun", items: [["Pengaturan", Settings, "/pengaturan"]] },
] as const satisfies readonly NavSection[];

export function DashboardChromeClient({user,children,streak=0}:{user:UserShape;children:React.ReactNode;streak?:number}){
  const [open,setOpen]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [notifs,setNotifs]=useState<NotificationItem[]>([]);
  const [unreadCount,setUnreadCount]=useState(0);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isExportHubOpen, setIsExportHubOpen] = useState(false);
  const router=useRouter();
  const pathname=usePathname();
  const isStudent=user.role==="STUDENT";
  const navSections: readonly NavSection[]=user.role==="MENTOR"?mentorNavSections:user.role==="SUPER_ADMIN"?adminNavSections:studentNavSections;
  const notificationCacheKey = user.email.trim().toLowerCase();
  const roleClass = `role-${user.role.toLowerCase().replace(/_/g, "-")}`;
  const roleLabel = user.role==="STUDENT"?"Peserta":user.role==="MENTOR"?"Mentor":"Super Admin";
  const isNavActive = (href:string) => {
    if (href.includes("#")) return false;
    return href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  };
  const roleHomeTitle = user.role === "STUDENT" ? "Program saya" : user.role === "MENTOR" ? "Workspace Mentor" : "Kontrol Admin";
  const currentPageTitle = navSections
    .flatMap(section => section.items)
    .find(([, , href]) => isNavActive(href))?.[0] ?? roleHomeTitle;

  useEffect(()=>{
    let cancelled = false;
    const loadNotifications = () => {
      const now = Date.now();
      const cacheStore = (globalThis as NotificationCacheGlobal).__profasNotifCache;
      const globalCache = cacheStore?.[notificationCacheKey];
      if (globalCache && now - globalCache.time < 45000) {
        setNotifs(globalCache.notifs);
        setUnreadCount(globalCache.unreadCount);
        return;
      }
      fetch("/api/notifications")
        .then(r=>r.ok?r.json():null)
        .then(data=>{
          if(data && !cancelled){
            setNotifs(data.notifications ?? []);
            setUnreadCount(data.unreadCount ?? 0);
            const globalScope = globalThis as NotificationCacheGlobal;
            globalScope.__profasNotifCache ??= {};
            globalScope.__profasNotifCache[notificationCacheKey] = {
              time: Date.now(),
              notifs: data.notifications ?? [],
              unreadCount: data.unreadCount ?? 0,
            };
          }
        })
        .catch(()=>null);
    };
    const browserWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const hasIdleCallback = typeof browserWindow.requestIdleCallback === "function";
    const idleId = hasIdleCallback
      ? browserWindow.requestIdleCallback(loadNotifications, { timeout: 1200 })
      : window.setTimeout(loadNotifications, 120);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setShowNotifs(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelled = true;
      if (hasIdleCallback && browserWindow.cancelIdleCallback) browserWindow.cancelIdleCallback(idleId as number);
      else window.clearTimeout(idleId as number);
      window.removeEventListener("keydown", handleKeyDown);
    };
  },[notificationCacheKey]);

  async function markReadAll(){
    const nextNotifs = notifs.map(n=>({...n,read:true}));
    setUnreadCount(0);
    setNotifs(nextNotifs);
    const globalScope = globalThis as NotificationCacheGlobal;
    globalScope.__profasNotifCache ??= {};
    globalScope.__profasNotifCache[notificationCacheKey] = { time: Date.now(), notifs: nextNotifs, unreadCount: 0 };
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read_all"})}).catch(()=>null);
  }

  async function markRead(id:string,link:string|null){
    const wasUnread = notifs.some(n=>n.id===id && !n.read);
    const nextNotifs = notifs.map(n=>n.id===id?{...n,read:true}:n);
    const nextUnreadCount = wasUnread ? Math.max(0, unreadCount-1) : unreadCount;
    setNotifs(nextNotifs);
    setUnreadCount(nextUnreadCount);
    const globalScope = globalThis as NotificationCacheGlobal;
    globalScope.__profasNotifCache ??= {};
    globalScope.__profasNotifCache[notificationCacheKey] = { time: Date.now(), notifs: nextNotifs, unreadCount: nextUnreadCount };
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",id})}).catch(()=>null);
    if(link){
      setShowNotifs(false);
      router.push(link);
    }
  }

  async function logout(){
    try{
      await fetch("/api/auth/logout",{method:"POST"});
    }finally{
      const globalScope = globalThis as NotificationCacheGlobal;
      if(globalScope.__profasNotifCache) delete globalScope.__profasNotifCache[notificationCacheKey];
      router.push("/");
      router.refresh();
    }
  }

  return <div className={`dashboard-fresh dashboard-layout pf-workspace-shell pf-workspace-minimal ${roleClass} ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside id="dashboard-navigation" className={`pf-workspace-sidebar ${open?"open":""}`} aria-label="Navigasi utama ruang belajar">
      <div className="pf-workspace-sidebar-header">
        <div className="pf-workspace-logo">
          {!collapsed && <Logo/>}
          {collapsed && <Logo compact />}
          {!collapsed && <span className="pf-workspace-logo-caption">Workspace</span>}
        </div>
        <button type="button" onClick={()=>setOpen(false)} aria-label="Tutup navigasi" aria-controls="dashboard-navigation" className="pf-workspace-sidebar-close"><X aria-hidden="true"/></button>
      </div>
      <nav className="pf-workspace-nav" aria-label="Menu ruang belajar">
        {navSections.map((section, sectionIndex) => {
          const sectionTitleId = `workspace-nav-section-${sectionIndex}`;
          return (
            <section
              className="pf-workspace-nav-section"
              aria-label={isStudent ? section.label : undefined}
              aria-labelledby={isStudent ? undefined : sectionTitleId}
              key={section.label}
            >
              {!isStudent && <h2 id={sectionTitleId} className={`pf-workspace-nav-section-title ${collapsed ? "sr-only" : ""}`}>{section.label}</h2>}
              <div className="pf-workspace-nav-links">
                {section.items.map(([label, Icon, href]) => {
                  const isActive = isNavActive(href);
                  return (
                    <Link
                      href={href}
                      key={label}
                      prefetch={false}
                      className={`pf-workspace-nav-link ${isActive ? "active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={collapsed ? label : undefined}
                      onClick={() => setOpen(false)}
                      title={collapsed ? label : undefined}
                    >
                      <Icon className="pf-workspace-nav-icon" aria-hidden="true"/>
                      <span className={`pf-workspace-nav-label ${collapsed ? "sr-only" : ""}`}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>
      <div className="pf-workspace-sidebar-footer">
        {!isStudent && <button type="button" onClick={()=>setCollapsed(!collapsed)} className="pf-workspace-sidebar-toggle" title={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-controls="dashboard-navigation" aria-expanded={!collapsed}><Menu aria-hidden="true"/><span className={collapsed ? "sr-only" : "pf-workspace-sidebar-action-label"}>{collapsed ? "Perluas navigasi" : "Ringkas menu"}</span></button>}
        <button type="button" onClick={logout} className="pf-workspace-logout" title="Keluar" aria-label="Keluar dari sistem"><LogOut aria-hidden="true"/><span className={collapsed ? "sr-only" : "pf-workspace-sidebar-action-label"}>Keluar</span></button>
      </div>
    </aside>
    {open && <button type="button" className="pf-workspace-backdrop" onClick={()=>setOpen(false)} aria-label="Tutup navigasi" aria-controls="dashboard-navigation" />}
    <div className="pf-workspace-canvas">
      <header className="pf-workspace-topbar">
        <button type="button" className="pf-workspace-menu-trigger" onClick={()=>setOpen(true)} aria-label="Buka navigasi" aria-controls="dashboard-navigation" aria-expanded={open}><Menu aria-hidden="true"/></button>
        <div className="flex items-center gap-4 pf-workspace-context">
          <strong className="pf-workspace-page-title">{pathname === "/dashboard" ? roleHomeTitle : currentPageTitle}</strong>
          {isStudent && streak > 0 && <span className="pf-workspace-streak-compact hide-on-mobile">{streak} hari beruntun</span>}
        </div>
        <div className="flex items-center gap-2.5 pf-workspace-actions" role="group" aria-label="Aksi cepat">
          {!isStudent && (
            <button
              type="button"
              onClick={() => setIsExportHubOpen(true)}
              className="pf-workspace-action pf-workspace-export"
              title="Buka pusat laporan dan ekspor"
              aria-label="Pusat laporan dan ekspor data"
              aria-haspopup="dialog"
            >
              <PieChart size={15} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="pf-workspace-action pf-workspace-search-icon"
            title="Cari cepat (Ctrl+K)"
            aria-label="Cari cepat di sistem (Ctrl+K)"
            aria-haspopup="dialog"
          >
            <Search aria-hidden="true" />
          </button>
          <button type="button" onClick={()=>setShowNotifs(v=>!v)} aria-label={`${showNotifs ? "Tutup" : "Buka"} notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}`} aria-expanded={showNotifs} aria-haspopup="dialog" aria-controls="workspace-notifications" className="pf-workspace-action pf-workspace-notification-trigger">
            <Bell aria-hidden="true"/>{unreadCount > 0 && <i className="notification-badge" aria-label={`${unreadCount} notifikasi belum dibaca`}>{unreadCount}</i>}
          </button>
          {showNotifs&&<div id="workspace-notifications" className="pf-workspace-notifications" role="dialog" aria-labelledby="workspace-notifications-title">
            <div className="pf-workspace-notifications-header">
              <b id="workspace-notifications-title" className="pf-workspace-notifications-title">Notifikasi</b>
              {unreadCount > 0 && <button type="button" onClick={markReadAll} className="pf-workspace-notifications-read-all"><Check className="icon-xs" aria-hidden="true"/> Tandai semua dibaca</button>}
            </div>
            <div className="pf-workspace-notifications-list">
              {notifs.length === 0 ? (
                <p className="pf-workspace-notifications-empty">Belum ada notifikasi baru.</p>
              ) : (
                notifs.map(n => (
                  <button type="button" key={n.id} className={`pf-workspace-notification-item ${n.read ? "" : "unread"}`} onClick={() => markRead(n.id, n.link)} aria-label={`${n.read ? "Buka" : "Baca"} notifikasi: ${n.title}`}>
                    <div className="pf-workspace-notification-copy">
                      <b>{n.title}</b>
                      <p>{n.message}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>}
          <Link href="/program" prefetch={false} className="pf-workspace-catalog-link hide-on-mobile">Katalog</Link>
          <Link href="/pengaturan" className="pf-workspace-user-link" aria-label={`Buka pengaturan akun ${user.name}`}>
            <span className={`pf-workspace-user-avatar ${user.avatar ? "has-avatar" : ""}`} aria-hidden="true">
              {/* User avatars can be Google-hosted or data URIs; a native image
                  keeps profile rendering independent from Next remote-host rules. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {user.avatar ? <img src={user.avatar} alt="" width={36} height={36} /> : initials(user.name)}
            </span>
            <span className="pf-workspace-user-copy">
              <b>{user.name}</b>
              <small>{roleLabel}</small>
            </span>
          </Link>
        </div>
      </header>
      <main id="workspace-main" className="pf-workspace-main">{children}</main>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} role={user.role} />
      {!isStudent && <ExecutiveExportHubModal isOpen={isExportHubOpen} onClose={() => setIsExportHubOpen(false)} initialRole={user.role} />}
    </div>
  </div>;
}
