"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Speaker {
  name: string;
  role: string;
  bullets: string[];
  image: string;
}

const speakers: Speaker[] = [
  {
    name: "Prof. Dr. Muhammad Asdar, S.E., M.Si.",
    role: "Guru Besar Fakultas Ekonomi dan Bisnis Universitas Hasanuddin",
    bullets: [
      "Lulusan S1 hingga S3 di bidang ekonomi dan manajemen.",
      "Anggota Dewan Profesor Universitas Hasanuddin periode 2022–2026.",
      "Mantan Rektor Universitas Cokroaminoto Makassar."
    ],
    image: "/images/mentor-1.png",
  },
  {
    name: "Prof. Dr. Firman Menne, S.E., M.Si., Ak., CA., CTA, ACPA",
    role: "Guru Besar Ilmu Akuntansi di Universitas Bosowa",
    bullets: [
      "Pernah menjabat berbagai posisi strategis, termasuk Wakil Rektor Universitas Bosowa.",
      "Memiliki pengalaman riset internasional di Australia.",
      "Penulis aktif berbagai buku referensi utama akuntansi syariah."
    ],
    image: "/images/mentor-2.png",
  },
  {
    name: "Bahrul Ulum Ilham, S.Pd., M.M., Ph.D.",
    role: "Akademisi ITB Nobel Indonesia dan Koordinator Konsultan PLUT Sulawesi Selatan",
    bullets: [
      "Meraih gelar Ph.D. Manajemen dari Universiti Kuala Lumpur pada tahun 2025.",
      "Ketua Umum DPN Asosiasi Business Development Services Indonesia (ABDSI) 2026–2030.",
      "Asesor BNSP bidang UMKM dan Certified Trainer dari ILO."
    ],
    image: "/images/mentor-3.png",
  }
];

export function MentorCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % speakers.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? speakers.length - 1 : prevIndex - 1));
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  return (
    <figure 
      className="pf-home-method-photo" 
      style={{ overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStartHandler}
      onTouchMove={onTouchMoveHandler}
      onTouchEnd={onTouchEndHandler}
    >
      <div 
        style={{ 
          display: 'flex', 
          width: `${speakers.length * 100}%`,
          transform: `translateX(-${(currentIndex * 100) / speakers.length}%)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%',
          flex: 1,
          willChange: 'transform'
        }}
      >
        {speakers.map((speaker, index) => (
          <div key={index} style={{ width: `${100 / speakers.length}%`, height: '100%', position: 'relative' }}>
            <Image
              src={speaker.image}
              alt={speaker.name}
              fill
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              sizes="(max-width: 860px) 100vw, 34vw"
            />
            <figcaption style={{ 
              zIndex: 10, 
              position: 'absolute', 
              bottom: '0', 
              left: '0', 
              right: '0', 
              padding: '24px',
              background: 'linear-gradient(to top, rgba(11, 31, 58, 0.95) 0%, rgba(11, 31, 58, 0.7) 60%, transparent 100%)',
              color: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ display: 'block', color: '#ffffff', fontFamily: 'var(--pf-font-ui)', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
                {speaker.name}
              </span>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.4, margin: '2px 0 6px 0', fontWeight: 500 }}>
                {speaker.role}
              </p>
              <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', lineHeight: 1.4, margin: 0, opacity: 0.85, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {speaker.bullets.map((bullet, i) => (
                  <li key={i} style={{ listStyleType: 'disc' }}>{bullet}</li>
                ))}
              </ul>
            </figcaption>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', display: 'flex', justifyContent: 'space-between', padding: '0 12px', transform: 'translateY(-50%)', zIndex: 11, pointerEvents: 'none' }}>
        <button 
          onClick={(e) => { e.preventDefault(); prevSlide(); }}
          style={{ 
            pointerEvents: 'auto',
            background: 'rgba(255,255,255,0.15)', 
            border: '1px solid rgba(255,255,255,0.3)', 
            borderRadius: '50%', 
            width: '36px', 
            height: '36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
          aria-label="Previous speaker"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); nextSlide(); }}
          style={{ 
            pointerEvents: 'auto',
            background: 'rgba(255,255,255,0.15)', 
            border: '1px solid rgba(255,255,255,0.3)', 
            borderRadius: '50%', 
            width: '36px', 
            height: '36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
          aria-label="Next speaker"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Indicators */}
      <div style={{ position: 'absolute', top: '16px', right: '20px', display: 'flex', gap: '6px', zIndex: 11 }}>
        {speakers.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: currentIndex === idx ? '16px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: currentIndex === idx ? '#ffffff' : 'rgba(255,255,255,0.5)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </figure>
  );
}
