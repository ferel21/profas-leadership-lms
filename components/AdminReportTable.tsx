"use client";

import { useState } from "react";
import { Download, Search, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

export type ReportRow = {
  id: string;
  name: string;
  email: string;
  course: string;
  progress: number;
  score: number | null;
  status: string;
  enrolledAt: string;
};

export function AdminReportTable({ data }: { data: ReportRow[] }) {
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");

  const filtered = data.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse ? r.course === filterCourse : true;
    return matchSearch && matchCourse;
  });

  const courses = Array.from(new Set(data.map(d => d.course)));

  const handleExport = () => {
    const headers = ["Nama,Email,Program,Progres (%),Nilai Rata-rata,Status,Tanggal Daftar"];
    const csv = filtered.map(r => 
      `"${r.name}","${r.email}","${r.course}",${r.progress},${r.score || ""},"${r.status}","${formatDate(new Date(r.enrolledAt))}"`
    );
    const blob = new Blob([[headers, ...csv].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Peserta_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="data-card" style={{ marginTop: '2rem' }}>
      <div className="data-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Laporan Detail Peserta</h2>
          <p>Filter, urutkan, dan ekspor data analitik peserta.</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={16} /> Ekspor CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input 
            type="text" 
            placeholder="Cari nama atau email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input" 
            style={{ width: '100%', paddingLeft: '2.5rem' }} 
          />
        </div>
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <select 
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="form-input" 
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          >
            <option value="">Semua Program</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--line)', color: 'var(--muted)' }}>
              <th style={{ padding: '1rem 0.5rem' }}>Peserta</th>
              <th style={{ padding: '1rem 0.5rem' }}>Program</th>
              <th style={{ padding: '1rem 0.5rem' }}>Status</th>
              <th style={{ padding: '1rem 0.5rem' }}>Progres</th>
              <th style={{ padding: '1rem 0.5rem' }}>Skor Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '1rem 0.5rem' }}>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{row.email}</div>
                </td>
                <td style={{ padding: '1rem 0.5rem' }}>{row.course}</td>
                <td style={{ padding: '1rem 0.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: row.status === 'LULUS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: row.status === 'LULUS' ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '1rem 0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, background: 'var(--line)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.progress}%`, background: 'var(--teal)', height: '100%' }}></div>
                    </div>
                    <span>{row.progress}%</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                  {row.score ? row.score : '-'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                  Tidak ada data yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length > 50 && <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '1rem', fontSize: '0.8rem' }}>Menampilkan 50 dari {filtered.length} baris. Ekspor CSV untuk melihat seluruh data.</p>}
      </div>
    </div>
  );
}
