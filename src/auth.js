/**
 * Minimalni OAuth 2.0 Authorization Code + PKCE klijent za Microsoft identity
 * platform. Namerno bez biblioteka: sve radi u browseru, bez build koraka.
 *
 * Napomene:
 * - Authority `common` prihvata i lične i poslovne/školske naloge.
 * - `crypto.subtle` radi samo u secure kontekstu (https ili localhost).
 * - Access token se drži u sessionStorage i nestaje kada se tab zatvori.
 */

const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const AUTHORIZE_ENDPOINT = `${AUTHORITY}/authorize`;
const TOKEN_ENDPOINT = `${AUTHORITY}/token`;

export const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'https://graph.microsoft.com/Tasks.Read',
  'https://graph.microsoft.com/User.Read',
];

const SESSION_KEY = 'mstodo.session.v1';
const PKCE_KEY = 'mstodo.pkce.v1';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(byteLength = 48) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function pkceChallenge(verifier) {
  if (!crypto.subtle) {
    throw new Error('Ovaj browser ne podržava Web Crypto. Otvori stranicu preko https:// ili http://localhost.');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function cleanUrl() {
  const { pathname, hash } = window.location;
  window.history.replaceState({}, document.title, `${pathname}${hash}`);
}

function tokenRequest(body) {
  return fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

/* ------------------------------------------------------------------ */
/* session                                                             */
/* ------------------------------------------------------------------ */

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

export function hasSession() {
  return Boolean(getSession());
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function storeTokenResponse(json, clientId, previousRefreshToken = null) {
  const session = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || previousRefreshToken || null,
    expiresAt: Date.now() + Number(json.expires_in || 3600) * 1000,
    clientId,
    scope: json.scope || SCOPES.join(' '),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/* ------------------------------------------------------------------ */
/* login / logout                                                      */
/* ------------------------------------------------------------------ */

export async function beginLogin(clientId, redirectUri) {
  if (!clientId) throw new Error('Nedostaje client ID.');

  const verifier = randomToken(64);
  const state = randomToken(24);

  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, clientId, redirectUri }));

  const url = new URL(AUTHORIZE_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();

  window.location.assign(url.toString());
}

/**
 * Završava prijavu ako u URL-u postoji `code` ili `error`.
 * Vraća `null` kada stranica nije redirect sa Microsofta.
 */
export async function completeLogin(clientIdFallback = '') {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (!code && !error) return null;

  if (error) {
    const description = params.get('error_description') || error;
    cleanUrl();
    sessionStorage.removeItem(PKCE_KEY);
    throw new Error(description);
  }

  const savedRaw = sessionStorage.getItem(PKCE_KEY);
  const state = params.get('state');
  cleanUrl();
  sessionStorage.removeItem(PKCE_KEY);

  if (!savedRaw) {
    throw new Error('Prijava je istekla ili je započeta u drugom tabu. Pokušaj ponovo.');
  }

  let saved;
  try {
    saved = JSON.parse(savedRaw);
  } catch {
    throw new Error('Sačuvano stanje prijave je neispravno. Pokušaj ponovo.');
  }

  if (!state || state !== saved.state) {
    throw new Error('Neispravan `state` parametar (CSRF zaštita). Pokušaj ponovo.');
  }

  const clientId = saved.clientId || clientIdFallback;
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: saved.redirectUri,
    code_verifier: saved.verifier,
    scope: SCOPES.join(' '),
  });

  const response = await tokenRequest(body);
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error_description || `Razmena koda nije uspela (HTTP ${response.status}).`);
  }

  storeTokenResponse(json, clientId);
  return json;
}

/**
 * Vraća važeći access token, osvežava ga refresh tokenom ako je istekao.
 */
export async function getAccessToken(clientId = '') {
  const session = getSession();
  if (!session) throw new Error('Nisi prijavljen.');

  if (session.expiresAt - 90_000 > Date.now()) return session.accessToken;

  if (!session.refreshToken) {
    clearSession();
    throw new Error('Sesija je istekla. Prijavi se ponovo.');
  }

  const body = new URLSearchParams({
    client_id: session.clientId || clientId,
    grant_type: 'refresh_token',
    refresh_token: session.refreshToken,
    scope: SCOPES.join(' '),
  });

  const response = await tokenRequest(body);
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    clearSession();
    throw new Error(json.error_description || 'Sesija je istekla. Prijavi se ponovo.');
  }

  const next = storeTokenResponse(json, session.clientId || clientId, session.refreshToken);
  return next.accessToken;
}
