"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

export function MobileMenu({signedIn}:{signedIn:boolean}){
  const [open,setOpen]=useState(false);
  useEffect(()=>{document.body.style.overflow=open?"hidden":"";return()=>{document.body.style.overflow=""}},[open]);
  const close=()=>setOpen(false);
  return <><button className="menu-button" onClick={()=>setOpen(true)} aria-label="Buka menu" aria-expanded={open}><Menu size={21}/></button>{open&&<div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigasi utama"><div><Logo/><button onClick={close} aria-label="Tutup menu"><X/></button></div><nav><Link href="/#tentang" onClick={close}>Tentang</Link><Link href="/program" onClick={close}>Program</Link><Link href="/#mentor" onClick={close}>Mentor</Link><Link href="/#insight" onClick={close}>Insight</Link></nav><Link href={signedIn?"/dashboard":"/daftar"} onClick={close} className="btn btn-primary">{signedIn?"Buka Dashboard":"Mulai Belajar"}</Link>{!signedIn&&<Link href="/masuk" onClick={close} className="mobile-login">Sudah punya akun? Masuk</Link>}</div>}</>;
}
