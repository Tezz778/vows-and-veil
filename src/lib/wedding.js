import { base44 } from '@/api/base44Client';

export const TIER_FEATURES = {
  single_day: ['timeline', 'ideas', 'budget', 'reminders', 'vendors', 'moodboard', 'optimizer'],
  multiday: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'vendors', 'moodboard', 'speeches', 'optimizer', 'rehearsal'],
  destination: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'travel', 'vendors', 'moodboard', 'speeches', 'optimizer', 'rehearsal']
};

export const TIER_LABELS = {
  single_day: 'Single Day',
  multiday: 'Multiday',
  destination: 'Destination'
};

export const TIER_PRICES = {
  single_day: 99,
  multiday: 299,
  destination: 399
};

export const TIER_DESCRIPTIONS = {
  single_day: 'Everything you need for a single-day celebration.',
  multiday: 'Full planning suite for multiday weekends.',
  destination: 'Complete package with travel & itinerary tools.'
};

export function hasFeature(tier, feature) {
  return (TIER_FEATURES[tier] || []).includes(feature);
}

export async function getWedding() {
  const list = await base44.entities.Wedding.list('-created_date', 1);
  return list && list.length ? list[0] : null;
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function computeAccessExpiry(weddingDate) {
  if (!weddingDate) return null;
  const d = new Date(weddingDate + 'T00:00:00');
  d.setDate(d.getDate() + 45);
  return d.toISOString().slice(0, 10);
}

export function hexToHsl(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}