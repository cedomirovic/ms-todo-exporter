import { t } from '../i18n.js';
import { formatInstant, summarize, taskDetails, visibleLists } from './shared.js';

export const id = 'txt';
export const label = 'TXT';
export const description = 'Plain text without any formatting. For email, terminal or quick review.';
export const extension = 'txt';
export const mime = 'text/plain';

const WIDTH = 64;

function rule(char = '─') {
  return char.repeat(WIDTH);
}

function indent(text, prefix) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => prefix + line)
    .join('\n');
}

export function build(data, options = {}) {
  const lang = options.lang || 'sr';
  const lists = visibleLists(data, options);
  const stats = summarize(data, options);
  const lines = [];

  lines.push(t(lang, 'txt.title'), '');
  lines.push(rule('='));
  lines.push(t(lang, 'txt.metaAccount', { name: data.account?.displayName || '', username: data.account?.username || '' }));
  if (data.account?.username) lines.push(`Korisnik: ${data.account.username}`);
  lines.push(t(lang, 'txt.metaExported', { date: formatInstant(data.exportedAt) }));
  lines.push(t(lang, 'txt.metaTotal', { total: stats.total, lists: stats.lists, done: stats.done, open: stats.open }));
  lines.push('');

  for (const list of lists) {
    if (!list.tasks.length) continue;

    const done = list.tasks.filter((task) => task.status === 'completed').length;
    lines.push(rule());
    lines.push(t(lang, 'txt.listHeader', { name: list.name, count: list.tasks.length, done }));
    lines.push(rule());
    lines.push('');

    for (const task of list.tasks) {
      const marker = task.status === 'completed' ? '[x]' : '[ ]';
      lines.push(`${marker} ${task.title}`);

      const { rows, checklist } = taskDetails(task, options);
      for (const [key, value] of rows) {
        lines.push(`    ${key}: ${value}`);
      }

      if (options.includeNotes !== false && task.notes) {
        lines.push(`    ${t(lang, 'labels.notes')}:`);
        lines.push(indent(task.notes, '      '));
      }

      for (const item of checklist) {
        lines.push(`      ${item.checked ? '[x]' : '[ ]'} ${item.text}`);
      }

      lines.push('');
    }
  }

  if (stats.total === 0) {
    lines.push(t(lang, 'txt.empty'), '');
  }

  lines.push(rule('='));
  lines.push(t(lang, 'txt.generated'));
  lines.push('');

  return lines.join('\n');
}
