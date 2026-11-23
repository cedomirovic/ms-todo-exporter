import { t } from '../i18n.js';
import { escapeMd, formatDate, formatInstant, summarize, taskDetails, visibleLists } from './shared.js';

export const id = 'markdown';
export const label = 'Markdown';
export const description = 'Markdown lista sa checkbox-ima.';
export const extension = 'md';
export const mime = 'text/markdown';

export function build(data, options = {}) {
  const lang = options.lang || 'sr';
  const lists = visibleLists(data, options);
  const stats = summarize(data, options);
  const lines = [];

  lines.push(`# ${t(lang, 'md.title')}`, '');
  lines.push(`- ${t(lang, 'md.metaAccount', { name: data.account?.displayName || '', username: data.account?.username || '' })}`);
  lines.push(`- ${t(lang, 'md.metaExported', { date: formatInstant(data.exportedAt) })}`);
  lines.push(`- ${t(lang, 'md.metaTotal', { total: stats.total, lists: stats.lists, done: stats.done, open: stats.open })}`);
  lines.push('');

  for (const list of lists) {
    if (!list.tasks.length) continue;

    const done = list.tasks.filter((task) => task.status === 'completed').length;
    lines.push(`## ${escapeMd(list.name)}`, '');
    lines.push(`<sub>${t(lang, 'md.listHeader', { name: list.name, count: list.tasks.length, done })}</sub>`, '');

    for (const task of list.tasks) {
      const checked = task.status === 'completed' ? 'x' : ' ';
      lines.push(`- [${checked}] **${escapeMd(task.title)}**`);

      const { rows, checklist } = taskDetails(task, options);
      for (const [key, value] of rows) {
        lines.push(`  - ${key}: ${value}`);
      }

      if (options.includeNotes !== false && task.notes) {
        lines.push(`  - ${t(lang, 'labels.notes')}:`);
        for (const noteLine of task.notes.split(/\r?\n/)) {
          lines.push(`    > ${escapeMd(noteLine)}`);
        }
      }

      for (const item of checklist) {
        lines.push(`    - [${item.checked ? 'x' : ' '}] ${escapeMd(item.text)}`);
      }

      lines.push('');
    }
  }

  if (stats.total === 0) {
    lines.push(`_${t(lang, 'export.preview.empty')}_`, '');
  }

  lines.push('---', '', t(lang, 'md.generated', { date: formatInstant(data.exportedAt) }), '');

  return lines.join('\n');
}
