/**
 * Svetlo / taman temi. Ljubezni, per browser-u, sa podešavanjem.
 */

export const THEMES = ['dark', 'light'];
export const THEME_KEY = 'mstodo.theme';
export const DEFAULT_THEME = 'dark';

export function getTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function setTheme(theme) {
  const safe = theme === 'light' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_KEY, safe);
  } catch {
    /* ignore */
  }
  applyTheme(safe);
  return safe;
}

export function applyTheme(theme) {
  const safe = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = safe;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = safe;
  return safe;
}

export function prefersLight() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}
