"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Award, Bell, BookOpen, Check, ClipboardCheck, FolderUp, Gauge, LayoutDashboard, LogOut, Menu, Trophy, X, History, Users, FileCheck2, Calendar, MessageSquare, Settings, PieChart, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { initials } from "@/utils";
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("./CommandPalette").then(m => ({ default: m.CommandPalette })), { ssr: false });
const ExecutiveExportHubModal = dynamic(() => import("@/components/shared/ExecutiveExportHubModal").then(m => ({ default: m.ExecutiveExportHubModal })), { ssr: false });

type UserShape = { name:string;username?:string|null;email:string;role:string;avatar?:string|null;headline?:string|null };
type NotificationItem = { id: string; title: string; message: string; read: boolean; link: string | null; createdAt: string };

const studentNav=[["Ringkasan",LayoutDashboard,"/dashboard"],["Program Saya",BookOpen,"/dashboard#program"],["Riwayat",History,"/riwayat"],["Kalender",Calendar,"/kalender"],["Absensi",ClipboardCheck,"/absensi"],["Sertifikat",Award,"/dashboard#sertifikat"],["Peringkat",Trophy,"/peringkat"],["Komunitas",MessageSquare,"/forum"],["Pengaturan",Settings,"/pengaturan"]] as const;
const mentorNav=[["Ringkasan",Gauge,"/dashboard"],["Manajemen Peserta",Users,"/dashboard/peserta"],["Riwayat Evaluasi",FileCheck2,"/dashboard/evaluasi"],["Materi Pembelajaran",FolderUp,"/dashboard#materi"],["Kalender",Calendar,"/kalender"],["Absensi",ClipboardCheck,"/absensi"],["Analitik",PieChart,"/dashboard/analitik"],["Komunitas",MessageSquare,"/forum"],["Pengaturan",Settings,"/pengaturan"]] as const;
const adminNav=[["Analitik",PieChart,"/dashboard"],["Absensi",ClipboardCheck,"/absensi"],["Komunitas",MessageSquare,"/forum"],["Pengaturan",Settings,"/pengaturan"]] as const;

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
  const nav=user.role==="MENTOR"?mentorNav:user.role==="SUPER_ADMIN"?adminNav:studentNav;
  const roleClass = `role-${user.role.toLowerCase().replace(/_/g, "-")}`;
  const roleLabel = user.role==="STUDENT"?"Peserta":user.role==="MENTOR"?"Mentor":"Super Admin";
  const navSections = user.role === "MENTOR"
    ? [
        { label: "Beranda", indices: [0] },
        { label: "Peserta & evaluasi", indices: [1, 2] },
        { label: "Pembelajaran", indices: [3, 4, 5] },
        { label: "Wawasan", indices: [6, 7] },
        { label: "Akun", indices: [8] },
      ]
    : user.role === "SUPER_ADMIN"
      ? [
          { label: "Beranda", indices: [0] },
          { label: "Operasional", indices: [1, 2] },
          { label: "Akun", indices: [3] },
        ]
      : [
          { label: "Beranda", indices: [0, 1] },
          { label: "Aktivitas belajar", indices: [2, 3, 4] },
          { label: "Pencapaian", indices: [5, 6] },
          { label: "Dukungan", indices: [7] },
          { label: "Akun", indices: [8] },
        ];

  useEffect(()=>{
    let cancelled = false;
    const loadNotifications = () => {
      const now = Date.now();
      const globalCache = (globalThis as unknown as { __profasNotifCache?: { time: number; notifs: NotificationItem[]; unreadCount: number } }).__profasNotifCache;
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
            (globalThis as unknown as { __profasNotifCache?: { time: number; notifs: NotificationItem[]; unreadCount: number } }).__profasNotifCache = {
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
  },[]);

  async function markReadAll(){
    setUnreadCount(0);
    setNotifs(prev=>prev.map(n=>({...n,read:true})));
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read_all"})}).catch(()=>null);
  }

  async function markRead(id:string,link:string|null){
    setNotifs(prev=>prev.map(n=>n.id===id?{...n,read:true}:n));
    setUnreadCount(prev=>Math.max(0,prev-1));
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",id})}).catch(()=>null);
    if(link){
      setShowNotifs(false);
      router.push(link);
    }
  }

  async function logout(){try{await fetch("/api/auth/logout",{method:"POST"})}finally{router.push("/");router.refresh()}}

  return <div className={`dashboard-layout dashboard-fresh pf-workspace-shell ${roleClass} ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside id="dashboard-navigation" className={`dashboard-sidebar pf-workspace-sidebar ${open?"open":""}`} aria-label="Navigasi utama ruang belajar">
      <div className="sidebar-top pf-workspace-sidebar-header">
        <div className="pf-workspace-logo">
          {!collapsed && <Logo/>}
          {collapsed && <Logo compact />}
        </div>
        <button type="button" onClick={()=>setOpen(false)} aria-label="Tutup navigasi" aria-controls="dashboard-navigation" className="mobile-close-btn pf-workspace-sidebar-close"><X aria-hidden="true"/></button>
      </div>
      <section className="sidebar-user pf-workspace-profile" aria-label={`${user.name}, ${roleLabel}`}>
        <span className={`sidebar-user-avatar pf-workspace-profile-avatar ${user.avatar ? "has-avatar" : "pf-workspace-profile-avatar-fallback"}`} aria-hidden="true">
          {user.avatar ? <Image src={user.avatar} alt="" width={38} height={38} /> : initials(user.name)}
        </span>
        {!collapsed && <div className="pf-workspace-profile-copy"><b className="pf-workspace-profile-name">{user.username ? `@${user.username}` : user.name}</b><small className="pf-workspace-profile-role">{user.name} · {roleLabel}</small></div>}
      </section>
      <nav className="pf-workspace-nav" aria-label="Menu ruang belajar">
        {navSections.map((section, sectionIndex) => {
          const sectionTitleId = `workspace-nav-section-${sectionIndex}`;
          return (
            <section className="pf-workspace-nav-section" aria-labelledby={sectionTitleId} key={section.label}>
              <h2 id={sectionTitleId} className={`pf-workspace-nav-section-title ${collapsed ? "sr-only" : ""}`}>{section.label}</h2>
              <div className="pf-workspace-nav-links">
                {section.indices.map(index => {
                  const [label, Icon, href] = nav[index];
                  const isActive = pathname === href || (index === 0 && pathname === "/dashboard");
                  return (
                    <Link
                      href={href}
                      key={label}
                      prefetch={true}
                      onMouseEnter={() => {
                        try { if (href.startsWith("/")) router.prefetch(href.split("#")[0]); } catch {}
                      }}
                      className={`pf-workspace-nav-link ${isActive ? "active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={collapsed ? label : undefined}
                      onClick={(e) => {
                        if (href.includes('#') && pathname === href.split('#')[0]) {
                          const id = href.split('#')[1];
                          const el = document.getElementById(id);
                          if (el) {
                            e.preventDefault();
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                        setOpen(false);
                      }}
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
      <div className="sidebar-bottom pf-workspace-sidebar-footer">
        <button type="button" onClick={()=>setCollapsed(!collapsed)} className="desktop-toggle-btn pf-workspace-sidebar-toggle" title={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-controls="dashboard-navigation" aria-expanded={!collapsed}><Menu aria-hidden="true"/><span className={collapsed ? "sr-only" : "pf-workspace-sidebar-action-label"}>{collapsed ? "Perluas navigasi" : "Ringkas menu"}</span></button>
        <button type="button" onClick={logout} className="pf-workspace-logout" title="Keluar" aria-label="Keluar dari sistem"><LogOut aria-hidden="true"/><span className={collapsed ? "sr-only" : "pf-workspace-sidebar-action-label"}>Keluar</span></button>
      </div>
    </aside>
    {open && <button type="button" className="dashboard-backdrop pf-workspace-backdrop" onClick={()=>setOpen(false)} aria-label="Tutup navigasi" aria-controls="dashboard-navigation" />}
    <div className="dashboard-canvas pf-workspace-canvas">
      <header className="dashboard-header pf-workspace-topbar">
        <button type="button" className="dash-menu pf-workspace-menu-trigger" onClick={()=>setOpen(true)} aria-label="Buka navigasi" aria-controls="dashboard-navigation" aria-expanded={open}><Menu aria-hidden="true"/></button>
        <div className="dash-welcome flex items-center gap-4 pf-workspace-context">
          <span className="dash-brand-lockup pf-workspace-brand"><b>PROFAS</b><span>RUANG BELAJAR</span></span>
          <div className="flex items-center gap-2 hide-on-mobile pf-workspace-status-list">
            <div className="pro-live-pulse pf-workspace-status" title="Sistem pembelajaran aktif" role="status">
              <span className="pro-live-pulse-dot" aria-hidden="true"></span>
              <span>Sistem aktif</span>
            </div>
            {streak > 0 && (
              <div className="pro-streak-flame pf-workspace-status pf-workspace-streak" title={`${streak} hari belajar konsisten`}>
                <span>{streak} hari beruntun</span>
              </div>
            )}
          </div>
        </div>
        <div className="dash-actions flex items-center gap-2.5 pf-workspace-actions" role="group" aria-label="Aksi cepat">
          <button
            type="button"
            onClick={() => setIsExportHubOpen(true)}
            className="dashboard-tool-btn dashboard-export-btn pf-workspace-action pf-workspace-export"
            title="Buka pusat laporan dan ekspor"
            aria-label="Pusat laporan dan ekspor data"
            aria-haspopup="dialog"
          >
            <PieChart size={15} aria-hidden="true" />
            <span className="hide-on-mobile">Pusat laporan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="command-palette-btn dashboard-search-btn hide-on-mobile pf-workspace-action pf-workspace-search"
            title="Cari cepat (Ctrl+K)"
            aria-label="Cari cepat di sistem (Ctrl+K)"
            aria-haspopup="dialog"
          >
            <div>
              <Search size={15} aria-hidden="true" />
              <span>Cari</span>
            </div>
            <kbd>Ctrl K</kbd>
          </button>
          <button type="button" onClick={()=>setShowNotifs(v=>!v)} aria-label={`${showNotifs ? "Tutup" : "Buka"} notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}`} aria-expanded={showNotifs} aria-haspopup="dialog" aria-controls="workspace-notifications" className="notif-btn pf-workspace-action pf-workspace-notification-trigger">
            <Bell aria-hidden="true"/>{unreadCount > 0 && <i className="notification-badge" aria-label={`${unreadCount} notifikasi belum dibaca`}>{unreadCount}</i>}
          </button>
          {showNotifs&&<div id="workspace-notifications" className="notification-popover pf-workspace-notifications" role="dialog" aria-labelledby="workspace-notifications-title">
            <div className="notification-popover-header pf-workspace-notifications-header">
              <b id="workspace-notifications-title" className="pf-workspace-notifications-title">Notifikasi</b>
              {unreadCount > 0 && <button type="button" onClick={markReadAll} className="text-link pf-workspace-notifications-read-all"><Check className="icon-xs" aria-hidden="true"/> Tandai semua dibaca</button>}
            </div>
            <div className="notification-list pf-workspace-notifications-list">
              {notifs.length === 0 ? (
                <p className="notification-empty pf-workspace-notifications-empty">Belum ada notifikasi baru.</p>
              ) : (
                notifs.map(n => (
                  <button type="button" key={n.id} className={`notification-item pf-workspace-notification-item ${n.read ? "" : "unread"}`} onClick={() => markRead(n.id, n.link)} aria-label={`${n.read ? "Buka" : "Baca"} notifikasi: ${n.title}`}>
                    <div className="notif-content pf-workspace-notification-copy">
                      <b>{n.title}</b>
                      <p>{n.message}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>}
          <Link href="/program" prefetch={true} className="btn btn-primary btn-small hide-on-mobile pf-workspace-program-link">Jelajahi program</Link>
        </div>
      </header>
      <main id="workspace-main" className="dashboard-content pf-workspace-main">{children}</main>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <ExecutiveExportHubModal isOpen={isExportHubOpen} onClose={() => setIsExportHubOpen(false)} initialRole={user.role} />
    </div>
  </div>;
}
