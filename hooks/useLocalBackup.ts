"use client";

import { useEffect, useState } from "react";

interface UseLocalBackupOptions {
  /** Persist to localStorage even when the array becomes empty. Defaults to true. */
  persistWhenEmpty?: boolean;
}

/**
 * Auto-backs up an array of edits to localStorage and restores it on mount
 * when a non-empty backup exists. Used by the course/quiz builders to survive
 * transient network/database interruptions while a mentor is mid-edit.
 */
export function useLocalBackup<T>(key: string, initial: T[], options: UseLocalBackupOptions = {}) {
  const { persistWhenEmpty = true } = options;
  const [items, setItems] = useState<T[]>(initial);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems(parsed);
        setRestored(true);
      }
    } catch (e) {
      console.error(`Gagal memulihkan cadangan untuk ${key}:`, e);
    }
  }, [key]);

  useEffect(() => {
    if (persistWhenEmpty || items.length > 0) {
      localStorage.setItem(key, JSON.stringify(items));
    }
  }, [key, items, persistWhenEmpty]);

  const clearBackup = () => {
    localStorage.removeItem(key);
    setRestored(false);
  };

  return { items, setItems, restored, setRestored, clearBackup };
}
