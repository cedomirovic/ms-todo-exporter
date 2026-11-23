import { DEFAULT_LANG, localeFor, t } from '../i18n.js';

/** Zajedničke stvari za sve formate izvoza. */

export const STATUS_LABELS = {
  notStarted: 'Nije početo',
  inProgress: 'U toku',
  completed: 'Završeno',
  waitingOnOthers: 'Čeka druge',
  deferred: 'Odloženo',
};

export const IMPORTANCE_LABELS = {
  low: 'Niska',
  normal: 'Normalna',
  high: 'Visoka',
};

export function isCompleted(task) {
  return task.status === 'completed';
}

export function visibleLists(data, options = {}) {
  const includeCompleted = options.includeCompleted !== false;
  return (data.lists || []).map((list) => ({
    ...list,
    tasks: (list.tasks || []).filter((task) => includeCompleted || !isCompleted(task)),
  }));
}

export function summarize(data, options = {}) {
  const lists = visibleLists(data, options);
  let total = 0;
  let done = 0;
  for (const list of lists) {
    for (const task of list.tasks) {
      total += 1;
      if (isCompleted(task)) done += 1;
    }
  }
  return { lists: lists.length, total, done, open: total - done };
}

export function isOverdue(task, now = new Date()) {
  if (!task.due || isCompleted(task)) return false;
  const due = new Date(task.due.iso);
  if (Number.isNaN(due.getTime())) return false;
  if (task.due.allDay) {
    const [y, m, d] = task.due.iso.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, m - 1, d + 1) <= now.getTime();
  }
  return due.getTime() < now.getTime();
}

/* ------------------------------------------------------------------ */
/* escaping                                                            */
/* ------------------------------------------------------------------ */

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeMd(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/([`*_[\]<>])/g, '\\$1')
    .replace(/\r?\n/g, ' ');
}

/* ------------------------------------------------------------------ */
/* datumi                                                              */
/* ------------------------------------------------------------------ */

function instantValue(iso) {
  return { iso, raw: iso, allDay: false, floating: false, timeZone: 'UTC' };
}

export function formatDate(value, { withTime = true, style = 'human', locale } = {}) {
  if (!value || !value.iso) return '';

  if (style === 'iso') {
    if (value.allDay) return value.iso.slice(0, 10);
    if (value.floating) {
      const match = String(value.raw || value.iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      if (match) return withTime ? `${match[1]} ${match[2]}` : match[1];
    }
    const base = value.iso.slice(0, 16).replace('T', ' ');
    return withTime ? `${base}Z` : value.iso.slice(0, 10);
  }

  if (value.allDay) {
    const [y, m, d] = value.iso.slice(0, 10).split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  }

  let date;
  if (value.floating) {
    const match = String(value.raw || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return value.iso;
    date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
    );
  } else {
    date = new Date(value.iso);
  }

  if (Number.isNaN(date.getTime())) return value.iso;

  return new Intl.DateTimeFormat(
    locale,
    withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' },
  ).format(date);
}

export function formatInstant(iso, options = {}) {
  if (!iso) return '';
  return formatDate(instantValue(iso), options);
}

/* ------------------------------------------------------------------ */
/* detalji zadatka                                                     */
/* ------------------------------------------------------------------ */

export function taskDetails(task, options = {}) {
  const lang = options.lang || DEFAULT_LANG;
  const rows = [];

  if (task.due) rows.push([t(lang, 'labels.due'), formatDate(task.due, { withTime: true, locale: localeFor(lang) })]);
  if (task.reminder && task.isReminderOn) {
    rows.push([t(lang, 'labels.reminder'), formatDate(task.reminder, { withTime: true, locale: localeFor(lang) })]);
  }
  if (task.status && task.status !== 'notStarted' && task.status !== 'completed') {
    rows.push([t(lang, 'labels.taskStatus'), t(lang, `labels.status.${task.status}`)]);
  }
  if (task.importance && task.importance !== 'normal') {
    rows.push([t(lang, 'labels.taskImportance'), t(lang, `labels.importance.${task.importance}`)]);
  }
  if (task.categories?.length) {
    rows.push([t(lang, 'labels.tags'), task.categories.join(', ')]);
  }

  const checklist = options.includeChecklist === false ? [] : task.checklist || [];
  if (checklist.length) {
    const done = checklist.filter((item) => item.checked).length;
    rows.push([t(lang, 'labels.checklist'), `${done}/${checklist.length}`]);
  }

  if (task.completed) rows.push([t(lang, 'labels.completed'), formatDate(task.completed, { withTime: true, locale: localeFor(lang) })]);

  return { rows, checklist };
}
