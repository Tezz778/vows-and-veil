import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const SettingsContext = createContext();

const DEFAULTS = {
  timeFormat: '12h',
  timezone: null,
  themePreference: 'system',
  notif_email_reminders: true,
  notif_countdown_alerts: true,
  notif_rsvp_activity: true,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [wedding, setWedding] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const list = await base44.entities.Wedding.list('-created_date', 1);
      if (list && list.length) {
        const w = list[0];
        setWedding(w);
        setSettings({
          timeFormat: w.time_format || '12h',
          timezone: w.timezone || null,
          themePreference: w.theme_preference || 'system',
          notif_email_reminders: w.notif_email_reminders !== false,
          notif_countdown_alerts: w.notif_countdown_alerts !== false,
          notif_rsvp_activity: w.notif_rsvp_activity !== false,
        });
      }
    } catch {
      // ignore — use defaults
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply theme preference to <html>
  useEffect(() => {
    const apply = (pref) => {
      const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    apply(settings.themePreference);
    if (settings.themePreference === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.themePreference]);

  const updateSetting = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (wedding) {
      try {
        const updated = await base44.entities.Wedding.update(wedding.id, { [key]: value });
        setWedding(updated);
      } catch (e) {
        console.error('Failed to save setting:', e);
      }
    }
  }, [wedding]);

  const value = {
    ...settings,
    wedding,
    setWedding,
    loaded,
    updateSetting,
    reload: loadSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

/**
 * Format a "HH:MM" time string according to the user's time format preference.
 * @param {string} timeStr - time in "HH:MM" 24h format (e.g. "16:30")
 * @param {string} format - "12h" or "24h"
 * @returns {string} formatted time (e.g. "4:30 PM" or "16:30")
 */
export function formatTimePref(timeStr, format = '12h') {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (format === '24h') {
    return `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}