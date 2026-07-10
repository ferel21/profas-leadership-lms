"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CourseCard } from "./CourseCard";

type CatalogCourse = {
  id:string;slug:string;title:string;shortDescription:string;category:string;level:string;price:number;durationHours:number;rating:number;studentsCount:number;image:string;mentor:{name:string};
};

const levels=[{value:"",label:"Semua level"},{value:"BASIC",label:"Dasar"},{value:"INTERMEDIATE",label:"Menengah"},{value:"ADVANCED",label:"Lanjutan"}];

export function ProgramCatalog({courses}:{courses:CatalogCourse[]}){
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("");
  const [level,setLevel]=useState("");
  const [filtersOpen,setFiltersOpen]=useState(false);
  const categories=useMemo(()=>Array.from(new Set(courses.map(course=>course.category))),[courses]);
  const filtered=useMemo(()=>{
    const keyword=query.trim().toLocaleLowerCase("id-ID");
    return courses.filter(course=>(!category||course.category===category)&&(!level||course.level===level)&&(!keyword||[course.title,course.shortDescription,course.category,course.mentor.name].some(value=>value.toLocaleLowerCase("id-ID").includes(keyword))));
  },[courses,query,category,level]);
  function reset(){setQuery("");setCategory("");setLevel("")}
  return <section className="catalog-browser section" style={{ position: "relative", zIndex: 1 }}><div className="container">
    <div className="catalog-search glass hover-lift" style={{ borderRadius: "24px", padding: "8px 24px", height: "64px", marginBottom: "2rem", transition: "all 0.3s ease" }}>
      <Search style={{ color: "var(--teal)" }} />
      <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Cari program, topik, atau mentor..." aria-label="Cari program" style={{ fontSize: "14px", background: "transparent" }} />
      <button type="button" className={filtersOpen||!!level?"active":""} onClick={()=>setFiltersOpen(value=>!value)} aria-expanded={filtersOpen} aria-controls="catalog-level-filters" style={{ borderRadius: "12px", background: filtersOpen ? "var(--teal-light)" : "transparent", color: filtersOpen ? "var(--teal-dark)" : "var(--ink)", transition: "all 0.3s ease" }}>
        <SlidersHorizontal/> Filter {level&&<span>1</span>}
      </button>
    </div>
    {filtersOpen&&<div id="catalog-level-filters" className="catalog-levels glass" aria-label="Filter level" style={{ padding: "16px", borderRadius: "16px", marginBottom: "24px", display: "flex", gap: "12px", animation: "fade-in 0.3s ease" }}>
      {levels.map(item=><button type="button" key={item.value} className={level===item.value?"active":""} aria-pressed={level===item.value} onClick={()=>setLevel(item.value)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--line)", background: level === item.value ? "var(--teal)" : "transparent", color: level === item.value ? "white" : "inherit", transition: "all 0.2s ease" }}>{item.label}</button>)}
    </div>}
    <div className="filter-pills" style={{ gap: "12px", flexWrap: "wrap" }}>
      <button type="button" className={category===""?"active hover-lift":"hover-lift"} aria-pressed={category === ""} onClick={()=>setCategory("")} style={{ transition: "all 0.3s ease", padding: "10px 20px" }}>Semua Program</button>
      {categories.map(item=><button type="button" key={item} className={category===item?"active hover-lift":"hover-lift"} aria-pressed={category === item} onClick={()=>setCategory(item)} style={{ transition: "all 0.3s ease", padding: "10px 20px" }}>{item}</button>)}
    </div>
    <div className="catalog-result-meta" aria-live="polite"><span>{filtered.length} program ditemukan</span>{(query||category||level)&&<button type="button" onClick={reset}><X/> Hapus filter</button>}</div>
    {filtered.length>0?<div className="course-grid">{filtered.map(course=><CourseCard key={course.id} course={course}/>)}</div>:<div className="catalog-empty"><Search/><h2>Program belum ditemukan</h2><p>Coba kata kunci atau filter yang berbeda.</p><button type="button" className="btn btn-outline" onClick={reset}>Tampilkan semua program</button></div>}
  </div></section>;
}
