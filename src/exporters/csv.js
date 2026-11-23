import { localeFor, t } from '../i18n.js';
import { formatDate, taskDetails, visibleLists } from './shared.js';

export const id = 'csv';
export const label = 'CSV';
export const description = 'Tabela za Excel ili Google Sheets, sa UTF-8 BOM.';
export const extension = 'csv';
export const mime = 'text/csv';

const KEYS = ['list', 'task', 'status', 'importance', 'due', 'reminder', 'created', 'completed', 'checklist', 'tags', 'notes'];

export function build(data, options = {}) {
  const lang = options.lang || 'sr';
  const rows = [KEYS.map((key) => t(lang, `csv.columns.${key}`))];

  for (const list of visibleLists(data, options)) {
    for (const task of list.tasks) {
      const { checklist } = taskDetails(task, options);
      const checklistDone = checklist.filter((item) => item.checked).length;

      const row = [
        list.name,
        task.title,
        t(lang, `labels.status.${task.status}`),
        task.importance && task.importance !== 'normal'
          ? t(lang, `labels.importance.${task.importance}`)
          : '',
        task.due ? formatDate(task.due, { style: 'iso', locale: localeFor(lang) }) : '',
        task.isReminderOn ? formatDate(task.reminder, { style: 'iso', locale: localeFor(lang) }) : '',
        task.created
          ? formatDate({ iso: task.created, allDay: false, raw: task.created }, { style: 'iso', locale: localeFor(lang) })
          : '',
        task.completed ? formatDate(task.completed, { style: 'iso', locale: localeFor(lang) }) : '',
        checklist.length ? `${checklistDone}/${checklist.length}` : '',
        task.categories?.join('; ') || '',
        options.includeNotes === false ? '' : task.notes || '',
      ];

      rows.push(row);
    }
  }

  const body = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/\r\n?/g, '\n').replace(/\n/g, '\r\n').replace(/"/g, '""')}"`).join(',')).join('\r\n');

  return `\ufeff${body}\r\n`;
}
