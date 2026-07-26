'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Award, Zap, X } from 'lucide-react';
import './LiveActivityFeed.css';

type Activity = {
  id: string;
  name: string;
  action: string;
  target: string;
  timeAgo: string;
  type: 'course' | 'certificate' | 'register';
};

const DUMMY_ACTIVITIES: Activity[] = [
  { id: '1', name: 'Budi P.', action: 'baru saja menyelesaikan modul', target: 'Komunikasi Asertif', timeAgo: 'Baru saja', type: 'course' },
  { id: '2', name: 'Sarah A.', action: 'mendapatkan sertifikat', target: 'Pemimpin Adaptif', timeAgo: '2 menit lalu', type: 'certificate' },
  { id: '3', name: 'Reza R.', action: 'baru saja mendaftar ke', target: 'PROFAS Leadership LMS', timeAgo: '5 menit lalu', type: 'register' },
  { id: '4', name: 'Andi M.', action: 'menyelesaikan kuis', target: 'Delegasi & Pemberdayaan', timeAgo: '12 menit lalu', type: 'course' },
  { id: '5', name: 'Nadia K.', action: 'mendapatkan sertifikat', target: 'Manajemen Konflik', timeAgo: '15 menit lalu', type: 'certificate' },
];

export function LiveActivityFeed() {
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isDismissed || !mounted) return;

    // Show first popup after 3 seconds
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(initialDelay);
  }, [isDismissed, mounted]);

  useEffect(() => {
    if (isDismissed || !isVisible || !mounted) return;

    // Hide popup after 5 seconds, then show next one after 4 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentActivityIndex((prev) => (prev + 1) % DUMMY_ACTIVITIES.length);
        setIsVisible(true);
      }, 4000);
    }, 5000);

    return () => clearTimeout(hideTimer);
  }, [isVisible, isDismissed, mounted]);

  if (isDismissed || !mounted) return null;

  const activity = DUMMY_ACTIVITIES[currentActivityIndex];

  const getIcon = () => {
    switch (activity.type) {
      case 'course': return <CheckCircle2 size={18} className="al-feed-icon-course" />;
      case 'certificate': return <Award size={18} className="al-feed-icon-cert" />;
      case 'register': return <Zap size={18} className="al-feed-icon-reg" />;
    }
  };

  return (
    <div className={`al-live-feed ${isVisible ? 'al-live-feed-visible' : 'al-live-feed-hidden'}`}>
      <button 
        className="al-live-feed-close" 
        onClick={() => setIsDismissed(true)}
        aria-label="Tutup notifikasi aktivitas"
      >
        <X size={14} />
      </button>
      <div className="al-live-feed-icon">
        {getIcon()}
      </div>
      <div className="al-live-feed-content">
        <p className="al-live-feed-text">
          <strong>{activity.name}</strong> {activity.action} <strong>{activity.target}</strong>
        </p>
        <span className="al-live-feed-time">{activity.timeAgo}</span>
      </div>
    </div>
  );
}
