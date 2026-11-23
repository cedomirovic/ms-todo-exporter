import { t } from '../i18n.js';
import { escapeHtml, formatInstant, isOverdue, summarize, taskDetails, visibleLists } from './shared.js';

export const id = 'html';
export const label = 'HTML';
export const description = 'One standalone page with all lists. For reading, printing or sharing.';
export const extension = 'html';
export const mime = 'text/html';

const STYLE = `
:root { color-scheme: light dark; --bg:#f6f8fc; --panel:#fff; --text:#121a2b; --muted:#5f6c86; --border:#e2e8f3; --accent:#2563eb; --good:#0f9d76; --bad:#dc2626; }
@media (prefers-color-scheme: dark) { :root { --bg:#0b1020; --panel:#111a2c; --text:#e8eefb; --muted:#93a1bd; --border:#22304d; --accent:#6b9cff; --good:#34d399; --bad:#f87171; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; -webkit-font-smoothing:antialiased; }
.wrap { width:min(900px,100% - 2rem); margin:0 auto; padding:2.5rem 0 4rem; }
header h1 { margin:0 0 .35rem; font-size:clamp(1.5rem,4vw,2.1rem); letter-spacing:-.02em; }
header p { margin:0; color:var(--muted); font-size:.9rem; }
.stats { display:flex; flex-wrap:wrap; gap:.5rem; margin:1.25rem 0 0; padding:0; list-style:none; }
.stats li { padding:.4rem .7rem; background:var(--panel); border:1px solid var(--border); border-radius:10px; font-size:.8rem; color:var(--muted); }
.stats b { color:var(--text); font-size:.95rem; margin-right:.2rem; }
nav { display:flex; flex-wrap:wrap; gap:.4rem; margin:1.5rem 0 0; }
nav a { padding:.35rem .7rem; font-size:.8rem; color:var(--text); text-decoration:none; background:var(--panel); border:1px solid var(--border); border-radius:999px; }
nav a:hover { border-color:var(--accent); }
nav span { color:var(--muted); margin-left:.3rem; }
section { margin-top:1.75rem; }
h2 { display:flex; align-items:baseline; gap:.6rem; margin:0 0 .75rem; font-size:1.1rem; }
h2 .count { font-size:.75rem; font-weight:500; color:var(--muted); }
ul.tasks { margin:0; padding:0; list-style:none; display:grid; gap:.5rem; }
.task { padding:.85rem 1rem; background:var(--panel); border:1px solid var(--border); border-radius:12px; }
.task.is-done { opacity:.62; }
.task.is-overdue { border-color:color-mix(in srgb, var(--bad) 45%, var(--border)); }
.task__head { display:flex; align-items:flex-start; gap:.6rem; }
.task__head input { margin:.25rem 0 0; width:16px; height:16px; accent-color:var(--accent); flex:0 0 auto; }
.task__title { font-weight:600; line-height:1.4; }
.task.is-done .task__title { text-decoration:line-through; text-decoration-thickness:1px; }
.chips { display:flex; flex-wrap:wrap; gap:.3rem; margin:.5rem 0 0 1.55rem; }
.chip { padding:.15rem .45rem; font-size:.72rem; color:var(--muted); background:color-mix(in srgb, var(--accent) 7%, transparent); border:1px solid var(--border); border-radius:7px; }
.chip b { font-weight:600; color:var(--text); margin-right:.25rem; }
.chip--bad { color:var(--bad); border-color:color-mix(in srgb, var(--bad) 35%, var(--border)); }
.chip--bad b { color:var(--bad); }
.notes { margin:.55rem 0 0 1.55rem; font-size:.85rem; color:var(--muted); white-space:pre-line; }
ul.checklist { margin:.5rem 0 0 1.55rem; padding:0; list-style:none; display:grid; gap:.15rem; font-size:.82rem; color:var(--muted); }
ul.checklist li::before { content:"☐ "; margin-right:.2rem; }
ul.checklist li.done { text-decoration:line-through; opacity:.7; }
ul.checklist li.done::before { content:"☑ "; }
.empty { padding:1rem; color:var(--muted); font-size:.85rem; background:var(--panel); border:1px dashed var(--border); border-radius:12px; }
footer { margin-top:2.5rem; padding-top:1rem; border-top:1px solid var(--border); font-size:.75rem; color:var(--muted); }
@media print { body { background:#fff; } .task { break-inside:avoid; border-color:#ccc; } }
`;

function renderTask(task, options, now) {
  const done = task.status === 'completed';
  const overdue = isOverdue(task, now);
  const { rows, checklist } = taskDetails(task, options);

  const classes = ['task'];
  if (done) classes.push('is-done');
  if (overdue) classes.push('is-overdue');

  const chips = rows
    .map(([key, value]) => `<span class="chip"><b>${escapeHtml(key)}</b>${escapeHtml(value)}</span>`)
    .join('');

  const notes = options.includeNotes !== false && task.notes ? `<p class="notes">${escapeHtml(task.notes)}</p>` : '';
  const checklistHtml = checklist.length
    ? `<ul class="checklist">${checklist.map((item) => `<li class="${item.checked ? 'done' : ''}">${escapeHtml(item.text)}</li>`).join('')}</ul>`
    : '';

  return `<li class="${classes.join(' ')}">
  <div class="task__head">
    <input type="checkbox" ${done ? 'checked' : ''} disabled />
    <span class="task__title">${escapeHtml(task.title)}</span>
  </div>
  ${chips ? `<div class="chips">${chips}</div>` : ''}
  ${notes}
  ${checklistHtml}
</li>`;
}

export function build(data, options = {}) {
  const lang = options.lang || 'sr';
  const lists = visibleLists(data, options);
  const stats = summarize(data, options);
  const now = new Date();
  const overdue = lists.reduce((sum, list) => sum + list.tasks.filter((task) => isOverdue(task, now)).length, 0);

  const nav = lists
    .filter((list) => list.tasks.length)
    .map((list, index) => `<a href="#list-${index + 1}">${escapeHtml(list.name)}<span>${list.tasks.length}</span></a>`)
    .join('');

  const sections = lists
    .filter((list) => list.tasks.length)
    .map((list, index) => {
      const done = list.tasks.filter((task) => task.status === 'completed').length;
      const heading = `${escapeHtml(list.name)}<span class="count">${t(lang, 'md.taskCount', { count: list.tasks.length, done })}</span>`;
      const tasks = list.tasks.map((task) => renderTask(task, options, now)).join('\n    ');
      return `<section id="list-${index + 1}">
  <h2>${heading}</h2>
  <ul class="tasks">
    ${tasks}
  </ul>
</section>`;
    })
    .join('\n');

  const empty = stats.total === 0 ? `<p class="empty">${escapeHtml(t(lang, 'export.preview.empty'))}</p>` : '';
  const accountText = t(lang, 'md.metaAccount', { name: data.account?.displayName || '', username: data.account?.username || '' });

  const statsItems = [
    ['export.stats.tasks', stats.total],
    ['export.stats.lists', stats.lists],
    ['export.stats.done', stats.done],
    ['export.stats.open', stats.open],
  ];

  const statsHtml = statsItems
    .map(([key, value]) => `<li><b>${value}</b>${escapeHtml(t(lang, key))}</li>`)
    .join('');

  const statsBlock = `
    <ul class="stats">
      ${statsHtml}
      ${overdue ? `<li><b>${overdue}</b>${escapeHtml(t(lang, 'export.stats.overdue'))}</li>` : ''}
    </ul>`;

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Microsoft To Do — export</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Microsoft To Do</h1>
    <p>${escapeHtml(accountText)} · ${escapeHtml(formatInstant(data.exportedAt))}</p>
    ${statsBlock}
    ${nav ? `<nav>${nav}</nav>` : ''}
  </header>
  ${empty}
  ${sections}
  <footer>${escapeHtml(t(lang, 'txt.generated'))}</footer>
</div>
</body>
</html>
`;
}
