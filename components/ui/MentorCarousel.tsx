"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type TouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Speaker {
  name: string;
  role: string;
  credentials: string[];
  image: string;
}

const speakers: Speaker[] = [
  {
    name: "Prof. Dr. Muhammad Asdar, S.E., M.Si.",
    role: "Guru Besar Fakultas Ekonomi dan Bisnis Universitas Hasanuddin",
    credentials: [
      "Lulusan S1 hingga S3 di bidang ekonomi dan manajemen.",
      "Anggota Dewan Profesor Universitas Hasanuddin periode 2022–2026.",
      "Mantan Rektor Universitas Cokroaminoto Makassar.",
    ],
    image: "/images/mentor-1.png",
  },
  {
    name: "Prof. Dr. Firman Menne, S.E., M.Si., Ak., CA., CTA, ACPA",
    role: "Guru Besar Ilmu Akuntansi di Universitas Bosowa",
    credentials: [
      "Pernah menjabat berbagai posisi strategis, termasuk Wakil Rektor Universitas Bosowa.",
      "Memiliki pengalaman riset internasional di Australia.",
      "Penulis aktif berbagai buku referensi utama akuntansi syariah.",
    ],
    image: "/images/mentor-2.png",
  },
  {
    name: "Bahrul Ulum Ilham, S.Pd., M.M., Ph.D.",
    role: "Akademisi ITB Nobel Indonesia dan Koordinator Konsultan PLUT Sulawesi Selatan",
    credentials: [
      "Meraih gelar Ph.D. Manajemen dari Universiti Kuala Lumpur pada tahun 2025.",
      "Ketua Umum DPN Asosiasi Business Development Services Indonesia (ABDSI) 2026–2030.",
      "Asesor BNSP bidang UMKM dan Certified Trainer dari ILO.",
    ],
    image: "/images/mentor-3.png",
  },
];

const AUTOPLAY_DELAY_MS = 7_000;
const MIN_SWIPE_DISTANCE = 50;

export function MentorCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex((index + speakers.length) % speakers.length);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((previous) => (previous + 1) % speakers.length);
  }, []);

  const previousSlide = useCallback(() => {
    setCurrentIndex((previous) => (previous - 1 + speakers.length) % speakers.length);
  }, []);

  const isAutoRotating = !prefersReducedMotion && !isPaused && !isHovered && !hasFocus;

  useEffect(() => {
    if (!isAutoRotating) return;

    const timer = window.setTimeout(nextSlide, AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [currentIndex, isAutoRotating, nextSlide]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
    touchEnd.current = null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    touchEnd.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStart.current === null || touchEnd.current === null) return;

    const distance = touchStart.current - touchEnd.current;
    if (distance > MIN_SWIPE_DISTANCE) nextSlide();
    if (distance < -MIN_SWIPE_DISTANCE) previousSlide();

    touchStart.current = null;
    touchEnd.current = null;
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setHasFocus(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousSlide();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextSlide();
    }

    if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      goToSlide(speakers.length - 1);
    }
  };

  return (
    <section
      className="pf-home-method-photo pf-mentor-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Profil mentor PROFAS"
      data-current-slide={currentIndex + 1}
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="pf-mentor-carousel__viewport" aria-live={isAutoRotating ? "off" : "polite"}>
        <div
          className="pf-mentor-carousel__track"
          style={{ transform: `translate3d(-${currentIndex * 100}%, 0, 0)` }}
        >
          {speakers.map((speaker, index) => (
            <figure
              className="pf-mentor-carousel__slide"
              key={speaker.name}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${speakers.length}: ${speaker.name}`}
              aria-hidden={index !== currentIndex}
            >
              <div className="pf-mentor-carousel__media">
                <div className="pf-mentor-carousel__portrait">
                  <Image
                    src={speaker.image}
                    alt={`Potret ${speaker.name}`}
                    fill
                    priority={index === 0}
                    draggable={false}
                    sizes="(max-width: 860px) calc(100vw - 40px), 390px"
                  />
                </div>
              </div>

              <figcaption className="pf-mentor-carousel__content">
                <span className="pf-mentor-carousel__kicker">Pengajar PROFAS</span>
                <h3>{speaker.name}</h3>
                <p className="pf-mentor-carousel__role">{speaker.role}</p>
                <ul aria-label={`Rekam jejak ${speaker.name}`}>
                  {speaker.credentials.map((credential) => (
                    <li key={credential}>{credential}</li>
                  ))}
                </ul>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="pf-mentor-carousel__topbar" aria-hidden="true">
        <span>Mentor pilihan</span>
        <span>{String(currentIndex + 1).padStart(2, "0")} / {String(speakers.length).padStart(2, "0")}</span>
      </div>

      <button
        type="button"
        className="pf-mentor-carousel__autoplay"
        aria-label={
          prefersReducedMotion
            ? "Pergantian otomatis dinonaktifkan sesuai preferensi gerak"
            : isPaused
              ? "Lanjutkan pergantian mentor otomatis"
              : "Jeda pergantian mentor otomatis"
        }
        aria-pressed={isPaused || prefersReducedMotion}
        disabled={prefersReducedMotion}
        onClick={() => setIsPaused((paused) => !paused)}
      >
        {isPaused || prefersReducedMotion ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>

      <div className="pf-mentor-carousel__arrows">
        <button type="button" onClick={previousSlide} aria-label="Tampilkan mentor sebelumnya">
          <ChevronLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={nextSlide} aria-label="Tampilkan mentor berikutnya">
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="pf-mentor-carousel__pagination" aria-label="Pilih profil mentor">
        {speakers.map((speaker, index) => (
          <button
            type="button"
            key={speaker.name}
            className={currentIndex === index ? "is-active" : ""}
            aria-label={`Tampilkan profil ${speaker.name}`}
            aria-current={currentIndex === index ? "true" : undefined}
            onClick={() => goToSlide(index)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>

      <p className="pf-visually-hidden" aria-live="polite" aria-atomic="true">
        Menampilkan profil {speakers[currentIndex].name}, mentor {currentIndex + 1} dari {speakers.length}.
      </p>
    </section>
  );
}
