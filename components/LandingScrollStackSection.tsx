'use client';

import React from 'react';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import { Compass, Users2, Target, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const LandingScrollStackSection: React.FC = () => {
  return (
    <section className="al-section al-section--white" id="eksekutif-stack" aria-labelledby="stack-title">
      <div className="container">
        <div className="al-section-head" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div className="al-badge-pill" style={{ margin: '0 auto 12px', display: 'inline-flex' }}>
            <span className="al-badge-dot" style={{ background: '#3b82f6' }} />
            <span>Fitur Baru • 3D Scroll Stack Interaktif</span>
          </div>
          <h2 id="stack-title" style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a' }}>
            4 Tahap Transformasi Kepemimpinan Eksekutif.
          </h2>
          <p style={{ maxWidth: '680px', margin: '0 auto', fontSize: '1.1rem', color: '#475569' }}>
            Gulir perlahan ke bawah untuk melihat bagaimana setiap modul bertumpuk secara dinamis dan membangun kapasitas kepemimpinan Anda lapis demi lapis.
          </p>
        </div>
      </div>

      <ScrollStack
        useWindowScroll={true}
        itemDistance={50}
        itemScale={0.04}
        itemStackDistance={35}
        stackPosition="15%"
        scaleEndPosition="8%"
        baseScale={0.88}
        blurAmount={2}
        rotationAmount={0}
      >
        <ScrollStackItem itemClassName="stack-card-step-1">
          <div className="stack-card-content">
            <div className="stack-card-header">
              <div className="stack-card-badge" style={{ background: 'linear-gradient(135deg, #1e5a8f, #2a6ba7)' }}>
                <Compass size={24} color="#ffffff" />
              </div>
              <span className="stack-step-label">TAHAP 01 • ORIENTASI STRATEGIS</span>
            </div>
            <h3 className="stack-card-title">Mendiagnosis Budaya Kerja & Visi Organisasi</h3>
            <p className="stack-card-desc">
              Pelajari cara membaca dinamika tersembunyi dalam tim, mengidentifikasi kebocoran produktivitas, dan merancang kompas kepemimpinan yang jernih di tengah ketidakpastian pasar digital.
            </p>
            <div className="stack-card-footer">
              <div className="stack-card-tags">
                <span><CheckCircle2 size={16} color="#10b981" /> Leadership Assessment</span>
                <span><CheckCircle2 size={16} color="#10b981" /> Culture Mapping</span>
              </div>
              <Link href="/program" className="stack-card-link">
                Lihat Silabus <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </ScrollStackItem>

        <ScrollStackItem itemClassName="stack-card-step-2">
          <div className="stack-card-content">
            <div className="stack-card-header">
              <div className="stack-card-badge" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
                <Users2 size={24} color="#ffffff" />
              </div>
              <span className="stack-step-label">TAHAP 02 • KOMUNIKASI EKSEKUTIF</span>
            </div>
            <h3 className="stack-card-title">Seni Negosiasi Tinggi & Manajemen Konflik</h3>
            <p className="stack-card-desc">
              Kuasai teknik komunikasi asertif untuk menyatukan tim lintas generasi yang terpecah, menangani krisis internal dengan tenang, dan memimpin rapat dengan pengaruh kuat tanpa otoritarianisme.
            </p>
            <div className="stack-card-footer">
              <div className="stack-card-tags">
                <span><CheckCircle2 size={16} color="#10b981" /> Active Listening</span>
                <span><CheckCircle2 size={16} color="#10b981" /> Crisis Resolution</span>
              </div>
              <Link href="/program" className="stack-card-link">
                Lihat Silabus <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </ScrollStackItem>

        <ScrollStackItem itemClassName="stack-card-step-3">
          <div className="stack-card-content">
            <div className="stack-card-header">
              <div className="stack-card-badge" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                <Target size={24} color="#ffffff" />
              </div>
              <span className="stack-step-label">TAHAP 03 • DELEGASI & EKSEKUSI</span>
            </div>
            <h3 className="stack-card-title">Mendelegasikan Wewenang Tanpa Micromanagement</h3>
            <p className="stack-card-desc">
              Rancang sistem akuntabilitas berbasis data, distribusikan tanggung jawab kepada talenta yang tepat, dan bangun otonomi tim agar target tercapai tanpa ketergantungan penuh pada satu individu.
            </p>
            <div className="stack-card-footer">
              <div className="stack-card-tags">
                <span><CheckCircle2 size={16} color="#10b981" /> OKR & KPI Tracking</span>
                <span><CheckCircle2 size={16} color="#10b981" /> Empowerment Engine</span>
              </div>
              <Link href="/program" className="stack-card-link">
                Lihat Silabus <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </ScrollStackItem>

        <ScrollStackItem itemClassName="stack-card-step-4">
          <div className="stack-card-content">
            <div className="stack-card-header">
              <div className="stack-card-badge" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                <Award size={24} color="#ffffff" />
              </div>
              <span className="stack-step-label">TAHAP 04 • SERTIFIKASI & DAMPAK</span>
            </div>
            <h3 className="stack-card-title">Certified Leadership Executive (CLE) & Kaderisasi</h3>
            <p className="stack-card-desc">
              Selesaikan evaluasi akhir berbasis studi kasus nyata, peroleh sertifikat kredensial profesional terverifikasi berbarcode, dan bangun suksesi pemimpin baru di organisasi Anda.
            </p>
            <div className="stack-card-footer">
              <div className="stack-card-tags">
                <span><CheckCircle2 size={16} color="#10b981" /> Digital Certificate</span>
                <span><CheckCircle2 size={16} color="#10b981" /> Alumni Network</span>
              </div>
              <Link href="/daftar" className="stack-card-link stack-card-cta">
                Daftar Program Sekarang <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </ScrollStackItem>
      </ScrollStack>
    </section>
  );
};
