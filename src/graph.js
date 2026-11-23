import { t } from './i18n.js';

/**
 * Microsoft Graph klijent za Microsoft To Do.
 * Dokumentacija: https://learn.microsoft.com/graph/api/resources/todo-overview
 */

const GRAPH = 'https://graph.microsoft.com/v1.0';

let activeController = null;
let skipRequested = false;
let stopRequested = false;

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

function absolute(path) {
  return path.startsWith('http') ? path : `${GRAPH}${path}`;
}

async function graphFetch(path, getToken, attempt = 0) {
  const controller = new AbortController();
  activeController = controller;
  const timer = setTimeout(() => controller.abort(), 45_000);

  try {
    const token = await getToken();
    const response = await fetch(absolute(path), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (response.status === 401 && attempt < 1) {
      return graphFetch(path, getToken, attempt + 1);
    }

    if ((response.status === 429 || response.status === 503) && attempt < 3) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      const waitMs = (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 2) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return graphFetch(path, getToken, attempt + 1);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let message = `Microsoft Graph je vratio HTTP ${response.status}.`;
      try {
        const parsed = JSON.parse(text);
        if (parsed?.error?.message) message = parsed.error.message;
      } catch {
        if (text) message = `${message} ${text.slice(0, 200)}`;
      }
      const error = new Error(`${message} (HTTP ${response.status}) — zahtev: ${absolute(path)}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  } finally {
    clearTimeout(timer);
    if (activeController === controller) activeController = null;
  }
}

/**
 * Preskoči trenutnu listu i nastavi sa sljedećom (klik na „Preskoči listu“).
 */
export function cancelPending() {
  skipRequested = true;
}

/**
 * Zaustavi ceo import svih listi odjednom (klik na „Stop“).
 */
export function stopImport() {
  stopRequested = true;
  activeController?.abort();
}

async function getAll(path, getToken) {
  const items = [];
  let next = path;
  while (next) {
    const page = await graphFetch(next, getToken);
    if (Array.isArray(page.value)) items.push(...page.value);
    next = page['@odata.nextLink'] || null;
  }
  return items;
}

async function mapLimit(items, limit, worker) {
  const queue = items.slice();
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/* ------------------------------------------------------------------ */
/* parsiranje                                                          */
/* ------------------------------------------------------------------ */

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  bdquo: '„',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
};

function decodeEntities(value) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity] ?? match;
  });
}

/**
 * Todo `body.content` je HTML. Pretvaramo ga u čist tekst sa novim redovima,
 * da bi isti sadržaj lepo izgledao u svim formatima.
 */
export function stripHtml(html) {
  if (!html) return '';
  let text = String(html);
  text = text
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\s*\/\s*li\s*>/gi, '')
    .replace(/<\s*\/\s*(p|div|h[1-6]|tr|blockquote)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  text = decodeEntities(text);
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Graph vraća `{ dateTime, timeZone }`. Ako je vreme „naivno“ (bez offseta),
 * tretiramo ga kao lokalno vreme u datom timeZone-u. Microsoft To Do za rokove
 * uglavnom vraća UTC, a ostale zone čuvamo kao „floating“ vreme (bez pomeranja).
 */
export function parseGraphDateTime(value) {
  if (!value || !value.dateTime) return null;

  const raw = String(value.dateTime);
  const timeZone = String(value.timeZone || 'UTC');
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw);
  const isUtc = timeZone.toUpperCase() === 'UTC';

  let iso = raw;
  if (!hasOffset && isUtc) iso = `${raw.replace(/(\.\d+)?$/, '')}Z`;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const allDay = /T00:00:00(?:\.0+)?(?:Z|[+-]00:?00)?$/.test(raw) && (!hasOffset || isUtc);

  return {
    iso: date.toISOString(),
    raw,
    timeZone,
    allDay,
    floating: !hasOffset && !isUtc,
  };
}

/* ------------------------------------------------------------------ */
/* normalizacija                                                       */
/* ------------------------------------------------------------------ */

function normalizeTask(task) {
  const body = task.body || {};
  const notes = body.contentType === 'text' ? String(body.content || '').trim() : stripHtml(body.content);

  return {
    id: task.id,
    title: String(task.title || '').trim() || '(bez naslova)',
    status: task.status || 'notStarted',
    importance: task.importance || 'normal',
    notes,
    due: parseGraphDateTime(task.dueDateTime),
    reminder: parseGraphDateTime(task.reminderDateTime),
    isReminderOn: Boolean(task.isReminderOn),
    created: task.createdDateTime || null,
    modified: task.lastModifiedDateTime || null,
    completed: parseGraphDateTime(task.completedDateTime),
    categories: Array.isArray(task.categories) ? task.categories.filter(Boolean) : [],
    checklist: [],
  };
}

function normalizeList(list) {
  return {
    id: list.id,
    name: list.displayName || '(lista bez naziva)',
    wellknownListName: list.wellknownListName || 'none',
    isOwner: list.isOwner !== false,
    isShared: Boolean(list.isShared),
    tasks: [],
  };
}

/* ------------------------------------------------------------------ */
/* glavni ulaz                                                         */
/* ------------------------------------------------------------------ */

/**
 * Učitava profil, sve liste, sve zadatke i (opciono) sve podzadatke.
 *
 * @param {object} options
 * @param {() => Promise<string>} options.getToken
 * @param {(progress: {message: string, ratio?: number}) => void} [options.onProgress]
 * @param {boolean} [options.includeChecklist]
 * @param {boolean} [options.includeCompleted]
 * @param {string} [options.lang] — „sr“ ili „en“; koristi se za lokalizovanje poruka.
 */
export async function fetchTodoData({
  getToken,
  onProgress = () => {},
  includeChecklist = true,
  includeCompleted = true,
  lang = 'sr',
} = {}) {
  const currentLang = lang === 'en' ? 'en' : 'sr';

  skipRequested = false;
  stopRequested = false;

  onProgress({ message: t(currentLang, 'status.loadingProfile'), ratio: 0.02 });

  const me = await graphFetch('/me?$select=displayName,userPrincipalName,mail', getToken);

  onProgress({ message: t(currentLang, 'status.loadingLists'), ratio: 0.06 });
  const rawLists = await getAll(`/me/todo/lists?$top=100`, getToken);

  const lists = [];
  let processedTasks = 0;

  for (let index = 0; index < rawLists.length; index += 1) {
    if (stopRequested) break;

    if (skipRequested) {
      skipRequested = false;
      continue;
    }

    const rawList = rawLists[index];
    const list = normalizeList(rawList);

    onProgress({
      message: t(currentLang, 'status.loadingTasks', { name: list.name }),
      ratio: 0.1 + (0.75 * index) / Math.max(rawLists.length, 1),
    });

    let rawTasks = [];
    try {
      const filter = includeCompleted ? '' : "&$filter=status ne 'completed'";
      rawTasks = await getAll(
        `/me/todo/lists/${encodeURIComponent(rawList.id)}/tasks?$top=100${filter}`,
        getToken,
      );
    } catch (error) {
      // Jedna nepristupačna lista (npr. tuđa deljena lista) ne treba da obori ceo export.
      if (error.status === 401) throw error;
      console.warn(`Lista "${list.name}" nije učitana:`, error);
    }

    list.tasks = rawTasks.map(normalizeTask);

    if (includeChecklist && list.tasks.length) {
      onProgress({
        message: t(currentLang, 'status.loadingChecklist', { name: list.name }),
        ratio: 0.1 + (0.8 * (index + 0.5)) / Math.max(rawLists.length, 1),
      });

      await mapLimit(list.tasks, 4, async (task) => {
        try {
          const items = await getAll(
            `/me/todo/lists/${encodeURIComponent(rawList.id)}/tasks/${encodeURIComponent(task.id)}` +
              '/checklistItems?$top=100',
            getToken,
          );
          task.checklist = items.map((item) => ({
            id: item.id,
            text: item.displayName || '',
            checked: Boolean(item.isChecked),
          }));
        } catch (error) {
          if (error.status === 401) throw error;
          task.checklist = [];
        }
      });
    }

    processedTasks += list.tasks.length;
    lists.push(list);
  }

  onProgress({ message: t(currentLang, 'status.done', { lists: lists.length, tasks: processedTasks }), ratio: 1 });

  return {
    exportedAt: new Date().toISOString(),
    account: {
      displayName: me.displayName || me.userPrincipalName || 'Microsoft nalog',
      username: me.userPrincipalName || me.mail || '',
      source: 'graph',
    },
    lists,
  };
}
