import { base44 } from '@/api/base44Client';

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

/**
 * Save a single setting to the wedding entity and update the Layout's wedding state.
 */
export async function saveWeddingSetting(wedding, setWedding, key, value) {
  if (!wedding) return;
  setWedding({ ...wedding, [key]: value });
  try {
    const updated = await base44.entities.Wedding.update(wedding.id, { [key]: value });
    setWedding(updated);
  } catch (e) {
    console.error('Failed to save setting:', e);
  }
}