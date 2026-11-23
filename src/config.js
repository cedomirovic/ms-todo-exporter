const STORAGE_KEY = 'mstodo.clientId';

export function getClientId() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored.trim()) return stored.trim();
  const configured = window.MS_TODO_EXPORT_CONFIG?.clientId;
  return typeof configured === 'string' ? configured.trim() : '';
}

export function setClientId(value) {
  const trimmed = String(value || '').trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY);
  return trimmed;
}

/**
 * Adresa na koju se Microsoft vraća posle prijave. Mora biti identična onoj
 * koja je upisana kao Redirect URI u Azure app registraciji.
 */
export function getRedirectUri() {
  const configured = window.MS_TODO_EXPORT_CONFIG?.redirectUri;
  if (typeof configured === 'string' && configured.trim()) return configured.trim();
  return `${window.location.origin}${window.location.pathname}`;
}
