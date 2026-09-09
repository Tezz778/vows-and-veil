import { base44 } from '@/api/base44Client';

export const TIER_FEATURES = {
  single_day: ['timeline', 'vows', 'ideas', 'budget', 'reminders', 'vendors', 'moodboard', 'speeches', 'optimizer'],
  multiday: ['timeline', 'vows', 'ideas', 'budget', 'reminders', 'vendors', 'moodboard', 'speeches', 'optimizer', 'shotlist', 'guests', 'rehearsal'],
  destination: ['timeline', 'vows', 'ideas', 'budget', 'reminders', 'vendors', 'moodboard', 'speeches', 'optimizer', 'shotlist', 'guests', 'rehearsal', 'travel', 'itinerary']
};

export const TIER_LABELS = {
  single_day: 'Single Day',
  multiday: 'Multiday',
  destination: 'Destination'
};

export const TIER_PRICES = {
  single_day: 99,
  multiday: 199,
  destination: 399
};

export const TIER_DESCRIPTIONS = {
  single_day: 'The essentials for one beautiful day — timeline, vows, budget, and vendor tracking.',
  multiday: 'Adds guests, seating, shot list, and rehearsal dinner tools for a full weekend.',
  destination: 'Everything, plus guest travel, room blocks, and a shareable weekend itinerary.'
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