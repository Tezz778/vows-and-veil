const STORAGE_KEY = 'vv-theme';

export function getThemePreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref) {
  const isDark =
    pref === 'dark' ||
    (pref === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function setThemePreference(pref) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // ignore
  }
  applyTheme(pref);
  if (pref === 'system' && typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
  }
}