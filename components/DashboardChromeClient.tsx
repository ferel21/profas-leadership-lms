"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Award, Bell, BookOpen, Check, ClipboardCheck, FolderUp, Gauge, LayoutDashboard, LogOut, Menu, Trophy, X, History, Users, FileCheck2, Calendar, MessageSquare, Settings, PieChart, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { initials } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";

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
  const router=useRouter();
  const pathname=usePathname();
  const nav=user.role==="MENTOR"?mentorNav:user.role==="SUPER_ADMIN"?adminNav:studentNav;

  useEffect(()=>{
    fetch("/api/notifications")
      .then(r=>r.ok?r.json():null)
      .then(data=>{
        if(data){
          setNotifs(data.notifications ?? []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch(()=>null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  return <div className={`dashboard-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside className={`dashboard-sidebar glass ${open?"open":""}`}>
      <div className="sidebar-top">
        {!collapsed && <Logo/>}
        {collapsed && <span className="logo-mark"><i/><i/><i/></span>}
        <button onClick={()=>setOpen(false)} aria-label="Tutup menu" className="mobile-close-btn"><X/></button>
      </div>
      <div className="sidebar-user">
        <span className={user.avatar ? "has-avatar" : ""} style={!user.avatar ? {
          background: "linear-gradient(135deg, #0d9488, #14b8a6)",
          color: "#fff",
          fontWeight: 800,
          fontSize: "1rem",
          boxShadow: "0 4px 14px rgba(13,148,136,0.35)"
        } : {}}>{user.avatar ? <Image src={user.avatar} alt="" width={38} height={38} /> : initials(user.name)}</span>
        {!collapsed && <div><b>{user.username ? `@${user.username}` : user.name}</b><small>{user.name} · {user.role==="STUDENT"?"Peserta":user.role==="MENTOR"?"Mentor":"Super Admin"}</small></div>}
      </div>
      <nav>
        {nav.map(([label, Icon, href], index) => {
          const isActive = pathname === href || (index === 0 && pathname === "/dashboard");
          return (
            <Link 
              href={href} 
              key={label} 
              className={`hover-lift ${isActive ? "active" : ""}`} 
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
        <button onClick={()=>setCollapsed(!collapsed)} className="desktop-toggle-btn" title="Toggle Sidebar"><Menu/>{!collapsed && "Kecilkan Menu"}</button>
        <button onClick={logout} className="hover-lift" title="Keluar"><LogOut/>{!collapsed && "Keluar"}</button>
      </div>
    </aside>
    <div className="dashboard-canvas">
      <header className="dashboard-header glass">
        <button className="dash-menu" onClick={()=>setOpen(true)} aria-label="Buka menu"><Menu/></button>
        <div className="dash-welcome" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>PROFAS LEADERSHIP</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="hide-on-mobile">
            <div className="pro-live-pulse" title="Terhubung langsung ke Supabase Cloud DB">
              <span className="pro-live-pulse-dot"></span>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#10b981", letterSpacing: "0.05em" }}>LIVE CLOUD DB</span>
            </div>
            <div className="pro-streak-flame" title="7 Hari Belajar Konsisten">
              🔥 <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#f59e0b" }}>7d Streak</span>
            </div>
          </div>
        </div>
        <div className="dash-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Executive Command Palette Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hover-lift command-palette-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}
            title="Cari Cepat (Ctrl+K)"
          >
            <Search size={16} style={{ color: "#0d9488" }} />
            <span>Cari atau Perintah...</span>
            <kbd style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800, color: "#334155" }}>Ctrl+K</kbd>
          </button>
          <button onClick={()=>setShowNotifs(v=>!v)} aria-label="Tampilkan notifikasi" aria-expanded={showNotifs} className="notif-btn">
            <Bell/>{unreadCount > 0 && <i className="notification-badge">{unreadCount}</i>}
          </button>
          {showNotifs&&<div className="notification-popover">
            <div className="notification-popover-header">
              <b>Notifikasi</b>
              {unreadCount > 0 && <button onClick={markReadAll} className="text-link"><Check className="icon-xs"/> Tandai semua dibaca</button>}
            </div>
            <div className="notification-list">
              {notifs.length === 0 ? (
                <p className="notification-empty">Belum ada notifikasi baru.</p>
              ) : (
                notifs.map(n => (
                  <div key={n.id} className={`notification-item ${n.read ? "" : "unread"}`} onClick={() => markRead(n.id, n.link)}>
                    <div className="notif-content">
                      <b>{n.title}</b>
                      <p>{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>}
          <Link href="/program" className="btn btn-primary btn-small hide-on-mobile">Jelajahi Program</Link>
        </div>
      </header>
      <main className="dashboard-content">{children}</main>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  </div>;
}
