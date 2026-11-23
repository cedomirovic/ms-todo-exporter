import { t } from '../i18n.js';
import { formatInstant, taskDetails, visibleLists } from './shared.js';

export const id = 'ics';
export const label = 'ICS calendar';
export const description = 'Tasks as events with due dates. Import into Outlook, Google or Apple Calendar.';
export const extension = 'ics';
export const mime = 'text/calendar';

const CRLF = '\r\n';
const encoder = new TextEncoder();

function pad2(value) {
  return String(value).padStart(2, '0');
}

function icsUtc(date) {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

function nextDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}`;
}

function esc(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '\\n');
}

function fold(line) {
  if (encoder.encode(line).length <= 75) return line;
  const parts = [];
  let current = '';
  let bytes = 0;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      parts.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join(CRLF);
}

function dueToIcs(value) {
  if (!value) return null;

  if (value.allDay) {
    const ymd = value.iso.slice(0, 10);
    return { kind: 'date', start: ymd.replace(/-/g, ''), end: nextDay(ymd) };
  }

  if (value.floating) {
    const match = String(value.raw || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return null;
    return { kind: 'local', start: `${match[1]}${match[2]}${match[3]}T${match[4]}${match[5]}00` };
  }

  const date = new Date(value.iso);
  if (Number.isNaN(date.getTime())) return null;
  return { kind: 'utc', start: icsUtc(date) };
}

function uidFor(task) {
  const clean = String(task.id || task.title || 'task').replace(/[^A-Za-z0-9._-]/g, '');
  return `${clean || 'task'}@ms-todo-export`;
}

function descriptionFor(task, list, options) {
  const lang = options.lang || 'sr';
  const parts = [];
  const { rows, checklist } = taskDetails(task, options);

  for (const [key, value] of rows) {
    parts.push(`${key}: ${value}`);
  }

  if (options.includeNotes !== false && task.notes) parts.push(task.notes);
  parts.push(`Lista: ${list.name}`);

  for (const item of checklist) {
    parts.push(`${item.checked ? '[x]' : '[ ]'} ${item.text}`);
  }

  return esc(parts.join('\n'));
}

export function build(data, options = {}) {
  const lang = options.lang || 'sr';
  const lists = visibleLists(data, options);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ms-todo-exporter//Microsoft To Do Export//SR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(t(lang, 'ics.title'))}`,
    'X-WR-TIMEZONE:UTC',
  ];

  const allTasks = lists.reduce((sum, list) => sum + list.tasks.length, 0);
  let exported = 0;
  const stamp = icsUtc(new Date());

  for (const list of lists) {
    for (const task of list.tasks) {
      const due = dueToIcs(task.due);
      if (!due) continue;
      exported += 1;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uidFor(task)}`);
      lines.push(`DTSTAMP:${stamp}`);

      if (due.kind === 'date') {
        lines.push(`DTSTART;VALUE=DATE:${due.start}`);
        lines.push(`DTEND;VALUE=DATE:${due.end}`);
        lines.push('X-MICROSOFT-CDO-ALLDAYEVENT:TRUE');
      } else if (due.kind === 'local') {
        lines.push(`DTSTART:${due.start}`);
        lines.push('DURATION:PT30M');
      } else {
        lines.push(`DTSTART:${due.start}`);
        lines.push('DURATION:PT30M');
      }

      lines.push(`SUMMARY:${esc(task.title)}`);
      lines.push(`DESCRIPTION:${descriptionFor(task, list, options)}`);
      lines.push(`CATEGORIES:${['Microsoft To Do', list.name, ...(task.categories || [])].map((category) => esc(category)).join(',')}`);
      lines.push('X-MICROSOFT-CDO-BUSYSTATUS:FREE');
      lines.push('STATUS:CONFIRMED');
      if (task.status === 'completed') lines.push('PERCENT-COMPLETE:100');

      if (task.isReminderOn && task.reminder) {
        const reminder = new Date(task.reminder.iso);
        if (!Number.isNaN(reminder.getTime())) {
          lines.push('BEGIN:VALARM');
          lines.push('ACTION:DISPLAY');
          lines.push(`DESCRIPTION:${esc(`${t(lang, 'labels.reminder')}: ${task.title}`)}`);
          lines.push(`TRIGGER;VALUE=DATE-TIME:${icsUtc(reminder)}`);
          lines.push('END:VALARM');
        }
      }

      lines.push('END:VEVENT');
    }
  }

  lines.push(`X-WR-CALDESC:${esc(t(lang, 'ics.description', { date: formatInstant(data.exportedAt), done: exported, total: allTasks }))}`);
  lines.push('END:VCALENDAR');

  return `${lines.map(fold).join(CRLF)}${CRLF}`;
}
