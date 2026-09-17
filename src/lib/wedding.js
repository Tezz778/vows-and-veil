import { base44 } from '@/api/base44Client';

export const TIER_FEATURES = {
  free: ['timeline', 'vows'],
  single_day: ['timeline', 'ideas', 'budget', 'reminders', 'vendors', 'moodboard', 'optimizer'],
  multiday: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'vendors', 'moodboard', 'speeches', 'optimizer', 'rehearsal'],
  destination: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'travel', 'vendors', 'moodboard', 'speeches', 'optimizer', 'rehearsal']
};

export const TIER_LABELS = {
  free: 'Free',
  single_day: 'Single Day',
  multiday: 'Multiday',
  destination: 'Destination'
};

export const TIER_PRICES = {
  free: 0,
  single_day: 99,
  multiday: 299,
  destination: 399
};

export const TIER_DESCRIPTIONS = {
  free: 'Get started with timeline planning and vow writing.',
  single_day: 'Everything you need for a single-day celebration.',
  multiday: 'Full planning suite for multiday weekends.',
  destination: 'Complete package with travel & itinerary tools.'
};

export const TIMELINE_FREE_CAP = 5;

export const FEATURE_INFO = {
  budget: {
    title: 'Budget Tracker',
    description: 'Track estimated and actual costs across every category, monitor vendor deposits and balances, and always know what\u2019s paid and what\u2019s still owed.',
    points: ['Category-based budgeting', 'Vendor deposit & balance tracking', 'Estimated vs. actual comparison', 'Payment due-date reminders']
  },
  guests: {
    title: 'Guests & Seating Chart',
    description: 'Manage your full guest list, track RSVPs and meal choices, and arrange tables with drag-and-drop seating.',
    points: ['Guest list with RSVP tracking', 'Meal selection & dietary notes', 'Drag-and-drop seating chart', 'Invitation status monitoring']
  },
  shotlist: {
    title: 'Shot List',
    description: 'Build a must-have photo list so your photographer captures every important moment of your day.',
    points: ['Categorized shot checklist', 'Must-have moment tracking', 'Photographer-ready export', 'Custom shot notes']
  },
  rehearsal: {
    title: 'Rehearsal Dinner Planner',
    description: 'Plan your rehearsal dinner with a timeline, guest list, toast order, and menu notes in one place.',
    points: ['Rehearsal timeline builder', 'Guest list & RSVPs', 'Toast order management', 'Menu & venue notes']
  },
  reminders: {
    title: 'Countdown & Reminders',
    description: 'Stay on track with task reminders, due dates, and a live countdown to your wedding day.',
    points: ['Task reminders with due dates', 'Vendor-linked tasks', 'Overdue indicators', 'Wedding day countdown']
  },
  travel: {
    title: 'Destination Travel Suite',
    description: 'Manage hotel blocks, guest itineraries, packing lists, welcome bags, and weather backup plans for destination weddings.',
    points: ['Hotel block management', 'Guest itinerary builder', 'Packing & document checklists', 'Welcome bag tracking', 'Weather backup planning']
  },
  ideas: {
    title: 'Moment Ideas',
    description: 'Get AI-suggested wedding moment ideas tailored to your celebration, delivered throughout your engagement.',
    points: ['AI-generated moment suggestions', 'Save favorites to your timeline', 'Monthly inspiration by email']
  },
  vendors: {
    title: 'Vendor Directory',
    description: 'Track every vendor \u2014 venue, catering, photography, florals, music \u2014 with contacts, booking status, and payment details.',
    points: ['Vendor contact management', 'Booking status tracking', 'Deposit & balance management', 'Contract notes']
  },
  moodboard: {
    title: 'Mood Board',
    description: 'Collect visual inspiration, color palettes, and style notes in one beautiful, organized place.',
    points: ['Image inspiration collection', 'Color palette curation', 'Style notes by category', 'Visual planning grid']
  },
  speeches: {
    title: 'Speeches',
    description: 'Draft and refine wedding speeches with AI-assisted writing tools tailored to each speaker\u2019s role.',
    points: ['AI-assisted speech drafting', 'Role-based prompts', 'Tone selection', 'Save and refine drafts']
  },
  optimizer: {
    title: 'Timeline Optimizer',
    description: 'Get AI-powered suggestions for a perfectly paced wedding day timeline based on your guest count and vendors.',
    points: ['AI-paced run-of-show', 'Vendor-aware timing', 'Guest count optimization', 'One-click apply to timeline']
  }
};

export function hasFeature(tier, feature) {
  return (TIER_FEATURES[tier] || []).includes(feature);
}

export function isFreeTier(tier) {
  return tier === 'free';
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