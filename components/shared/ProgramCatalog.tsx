"use client";

import { useMemo, useState } from "react";
import { Compass, Search, SlidersHorizontal, X } from "lucide-react";
import { CourseCard } from "@/components/ui/CourseCard";

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

  return (
    <section className="catalog-browser section pf-catalog" aria-label="Katalog program">
      <div className="container pf-catalog__container">
        <div className="pf-catalog__layout">
          <aside className="pf-catalog__rail" aria-label="Pencarian dan filter program">
            <div className="pf-catalog__rail-heading">
              <span className="pf-catalog__rail-icon" aria-hidden="true">
                <Compass size={19} strokeWidth={1.8} />
              </span>
              <div>
                <p className="pf-catalog__rail-kicker">Panduan program</p>
                <h2>Temukan jalur Anda</h2>
              </div>
            </div>

            <div className="catalog-search glass hover-lift pf-catalog__search" role="search">
              <Search className="pf-catalog__search-icon" aria-hidden="true" />
              <label className="sr-only" htmlFor="program-catalog-search">
                Cari program
              </label>
              <input
                id="program-catalog-search"
                type="text"
                inputMode="search"
                value={query}
                onChange={event=>setQuery(event.target.value)}
                placeholder="Cari program, topik, atau mentor..."
                aria-label="Cari program"
              />
              <button
                type="button"
                className={`pf-catalog__filter-toggle ${filtersOpen||!!level?"active":""}`}
                onClick={()=>setFiltersOpen(value=>!value)}
                aria-expanded={filtersOpen}
                aria-controls="catalog-level-filters"
              >
                <SlidersHorizontal aria-hidden="true" />
                Filter
                {level&&<span className="pf-catalog__filter-count">1</span>}
              </button>
            </div>

            {filtersOpen&&(
              <div
                id="catalog-level-filters"
                className="catalog-levels glass pf-catalog__levels"
                role="group"
                aria-label="Filter level"
              >
                {levels.map(item=>(
                  <button
                    type="button"
                    key={item.value}
                    className={level===item.value?"active":""}
                    aria-pressed={level===item.value}
                    onClick={()=>setLevel(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="pf-catalog__category-group">
              <p className="pf-catalog__filter-label">Topik program</p>
              <div className="filter-pills pf-catalog__categories" role="group" aria-label="Filter kategori program">
                <button
                  type="button"
                  className={category===""?"active hover-lift":"hover-lift"}
                  aria-pressed={category === ""}
                  onClick={()=>setCategory("")}
                >
                  Semua Program
                </button>
                {categories.map(item=>(
                  <button
                    type="button"
                    key={item}
                    className={category===item?"active hover-lift":"hover-lift"}
                    aria-pressed={category === item}
                    onClick={()=>setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="pf-catalog__results">
            <div className="catalog-result-meta pf-catalog__result-meta" aria-live="polite">
              <span id="catalog-result-count">{filtered.length} program ditemukan</span>
              {(query||category||level)&&(
                <button type="button" onClick={reset}>
                  <X aria-hidden="true" />
                  Hapus filter
                </button>
              )}
            </div>

            {filtered.length>0?(
              <div
                className="course-grid pf-catalog__grid"
                role="region"
                aria-labelledby="catalog-result-count"
              >
                {filtered.map(course=><CourseCard key={course.id} course={course}/>)}
              </div>
            ):(
              <div className="catalog-empty pf-catalog__empty">
                <span className="pf-catalog__empty-icon" aria-hidden="true">
                  <Search />
                </span>
                <h2>Program belum ditemukan</h2>
                <p>Coba kata kunci atau filter yang berbeda.</p>
                <button type="button" className="btn btn-outline" onClick={reset}>
                  Tampilkan semua program
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
