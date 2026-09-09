import { base44 } from '@/api/base44Client';

export const TIER_FEATURES = {
  single_day: ['timeline', 'vows', 'ideas', 'budget', 'reminders', 'vendors'],
  multiday: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'vendors', 'moodboard', 'rehearsal', 'speeches'],
  destination: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'travel', 'vendors', 'moodboard', 'rehearsal', 'speeches']
};

export const TIER_LABELS = {
  single_day: 'Single Day',
  multiday: 'Multiday',
  destination: 'Destination'
};

export const TIER_PRICES = {
  single_day: 99,
  multiday: 197,
  destination: 347
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