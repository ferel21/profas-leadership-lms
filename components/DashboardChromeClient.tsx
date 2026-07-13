"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Award, Bell, BookOpen, Check, ClipboardCheck, FolderUp, Gauge, LayoutDashboard, LogOut, Menu, Trophy, X, History, Users, FileCheck2, Calendar, MessageSquare, Settings, PieChart, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { initials } from "@/lib/utils";
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("./CommandPalette").then(m => ({ default: m.CommandPalette })), { ssr: false });
const ExecutiveExportHubModal = dynamic(() => import("./ExecutiveExportHubModal").then(m => ({ default: m.ExecutiveExportHubModal })), { ssr: false });

type UserShape = { name:string;username?:string|null;email:string;role:string;avatar?:string|null;headline?:string|null };
type NotificationItem = { id: string; title: string; message: string; read: boolean; link: string | null; createdAt: string };

const studentNav=[["Ringkasan",LayoutDashboard,"/dashboard"],["Program Saya",BookOpen,"/dashboard#program"],["Riwayat",History,"/riwayat"],["Kalender",Calendar,"/kalender"],["Absensi",ClipboardCheck,"/absensi"],["Sertifikat",Award,"/dashboard#sertifikat"],["Peringkat",Trophy,"/peringkat"],["Komunitas",MessageSquare,"/forum"],["Pengaturan",Settings,"/pengaturan"]] as const;
const mentorNav=[["Ringkasan",Gauge,"/dashboard"],["Manajemen Peserta",Users,"/dashboard/peserta"],["Riwayat Evaluasi",FileCheck2,"/dashboard/evaluasi"],["Materi Pembelajaran",FolderUp,"/dashboard#materi"],["Kalender",Calendar,"/kalender"],["Absensi",ClipboardCheck,"/absensi"],["Analitik",PieChart,"/dashboard/analitik"],["Komunitas",MessageSquare,"/forum"],["Pengaturan",Settings,"/pengaturan"]] as const;
const adminNav=[["Analitik",PieChart,"/dashboard"],["Absensi",ClipboardCheck,"/absensi"],["Komunitas",MessageSquare,"/forum"],["Pengaturan",Settings,"/pengaturan"]] as const;

export function DashboardChromeClient({user,children}:{user:UserShape;children:React.ReactNode}){
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

  return <div className={`dashboard-layout dashboard-fresh ${roleClass} ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside className={`dashboard-sidebar ${open?"open":""}`} aria-label="Navigasi dashboard">
      <div className="sidebar-top">
        {!collapsed && <Logo/>}
        {collapsed && <Logo compact />}
        <button onClick={()=>setOpen(false)} aria-label="Tutup menu" className="mobile-close-btn"><X/></button>
      </div>
      <div className="sidebar-user">
        <span className={`sidebar-user-avatar ${user.avatar ? "has-avatar" : ""}`} style={!user.avatar ? {
          background: "linear-gradient(135deg, #2a6ba7, #1e5a8f)",
          color: "#fff",
          fontWeight: 800,
          fontSize: "1rem",
          boxShadow: "0 4px 14px rgba(42,107,167,0.35)"
        } : {}}>{user.avatar ? <Image src={user.avatar} alt="" width={38} height={38} /> : initials(user.name)}</span>
        {!collapsed && <div><b>{user.username ? `@${user.username}` : user.name}</b><small>{user.name} · {user.role==="STUDENT"?"Peserta":user.role==="MENTOR"?"Mentor":"Super Admin"}</small></div>}
      </div>
      <nav aria-label="Menu dashboard">
        {nav.map(([label, Icon, href], index) => {
          const isActive = pathname === href || (index === 0 && pathname === "/dashboard");
          return (
            <Link 
              href={href} 
              key={label} 
              prefetch={true}
              onMouseEnter={() => {
                try { if (href.startsWith("/")) router.prefetch(href.split("#")[0]); } catch {}
              }}
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
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
              title={collapsed ? label : ""}
            >
              <Icon />{!collapsed && label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <button onClick={()=>setCollapsed(!collapsed)} className="desktop-toggle-btn" title="Toggle Sidebar" aria-label={collapsed ? "Perbesar menu" : "Kecilkan menu"} aria-expanded={!collapsed}><Menu/>{!collapsed && "Kecilkan Menu"}</button>
        <button onClick={logout} title="Keluar"><LogOut/>{!collapsed && "Keluar"}</button>
      </div>
    </aside>
    {open && <button className="dashboard-backdrop" onClick={()=>setOpen(false)} aria-label="Tutup navigasi" />}
    <div className="dashboard-canvas">
      <header className="dashboard-header">
        <button className="dash-menu" onClick={()=>setOpen(true)} aria-label="Buka menu"><Menu/></button>
        <div className="dash-welcome flex items-center gap-4">
          <span className="dash-brand-lockup"><b>PROFAS</b><span>LEADERSHIP WORKSPACE</span></span>
          <div className="flex items-center gap-2 hide-on-mobile">
            <div className="pro-live-pulse" title="Sistem pembelajaran aktif">
              <span className="pro-live-pulse-dot"></span>
              <span>Sistem aktif</span>
            </div>
            <div className="pro-streak-flame" title="7 hari belajar konsisten">
              <span>7 hari beruntun</span>
            </div>
          </div>
        </div>
        <div className="dash-actions flex items-center gap-2.5">
          <button
            onClick={() => setIsExportHubOpen(true)}
            className="dashboard-tool-btn dashboard-export-btn"
            title="Pusat Ekspor & Pelaporan (31 Antigravity Skills: Excel, PDF, PPTX, DOCX)"
          >
            <PieChart size={15} />
            <span className="hide-on-mobile">Pusat laporan</span>
          </button>
          <button
            onClick={() => setIsCommandOpen(true)}
            className="command-palette-btn dashboard-search-btn hide-on-mobile"
            title="Cari Cepat (Ctrl+K)"
          >
            <div>
              <Search size={15} />
              <span>Cari...</span>
            </div>
            <kbd>Ctrl K</kbd>
          </button>
          <button onClick={()=>setShowNotifs(v=>!v)} aria-label="Tampilkan notifikasi" aria-expanded={showNotifs} className="notif-btn">
            <Bell/>{unreadCount > 0 && <i className="notification-badge">{unreadCount}</i>}
          </button>
          {showNotifs&&<div className="notification-popover" role="dialog" aria-label="Notifikasi">
            <div className="notification-popover-header">
              <b>Notifikasi</b>
              {unreadCount > 0 && <button onClick={markReadAll} className="text-link"><Check className="icon-xs"/> Tandai semua dibaca</button>}
            </div>
            <div className="notification-list">
              {notifs.length === 0 ? (
                <p className="notification-empty">Belum ada notifikasi baru.</p>
              ) : (
                notifs.map(n => (
                  <button type="button" key={n.id} className={`notification-item ${n.read ? "" : "unread"}`} onClick={() => markRead(n.id, n.link)} aria-label={`${n.read ? "Buka" : "Baca"} notifikasi: ${n.title}`}>
                    <div className="notif-content">
                      <b>{n.title}</b>
                      <p>{n.message}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>}
          <Link href="/program" prefetch={true} className="btn btn-primary btn-small hide-on-mobile">Jelajahi Program</Link>
        </div>
      </header>
      <main className="dashboard-content">{children}</main>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <ExecutiveExportHubModal isOpen={isExportHubOpen} onClose={() => setIsExportHubOpen(false)} initialRole={user.role} />
    </div>
  </div>;
}
