import { getClientId, setClientId, getRedirectUri } from './config.js';
import {
  beginLogin,
  completeLogin,
  getAccessToken,
  hasSession,
  clearSession,
} from './auth.js';
import { fetchTodoData, cancelPending, stopImport } from './graph.js';
import { buildDemoData } from './demo.js';
import { exporters, DEFAULT_FORMAT_IDS } from './exporters/index.js';
import { downloadFile, safeFilename } from './download.js';
import { createZip } from './zip.js';
import { getLang, setLang, translateDocument, t } from './i18n.js';
import { getTheme, setTheme, applyTheme } from './theme.js';
import { escapeHtml } from './exporters/shared.js';

const $ = (id) => document.getElementById(id);

const state = {
  clientId: '',
  data: null,
  selected: new Set(DEFAULT_FORMAT_IDS),
  busy: false,
  toastTimer: null,
  lang: getLang(),
  theme: getTheme(),
};

init();

/* ------------------------------------------------------------------ */
/* start                                                               */
/* ------------------------------------------------------------------ */

async function init() {
  state.lang = getLang();
  state.theme = applyTheme(getTheme());

  translateDocument(state.lang);
  syncLangSwitch();
  syncThemeToggle();

  state.clientId = getClientId();

  const redirectTarget = document.querySelector('.js-redirect');
  if (redirectTarget) redirectTarget.textContent = getRedirectUri();

  renderFormats();
  bindEvents();
  renderConfigState();
  updateFooterYear();

  if (location.protocol === 'file:') {
    showStatus(
      'error',
      t(state.lang, 'errors.notSupported'),
      state.lang === 'en'
        ? 'ES modules do not work with file://. Run a local server (e.g. `npx serve`) or publish the app.'
        : 'ES moduli ne rade sa file://. Pokreni lokalni server (npr. `npx serve`) ili objavi aplikaciju.',
    );
    return;
  }

  const params = new URLSearchParams(location.search);

  if (params.get('demo') === '1') {
    loadDemo();
    return;
  }

  if (params.has('code') || params.has('error')) {
    await finishLogin();
    return;
  }

  if (hasSession()) await loadFromGraph();
}

async function finishLogin() {
  setBusy(true);
  showStatus('info', t(state.lang, 'status.loading'), '', 0.05);
  try {
    const result = await completeLogin(state.clientId);
    hideStatus();
    if (result) await loadFromGraph();
  } catch (error) {
    showStatus('error', t(state.lang, 'errors.loginFailed'), error.message);
  } finally {
    setBusy(false);
  }
}

/* ------------------------------------------------------------------ */
/* podaci                                                              */
/* ------------------------------------------------------------------ */

async function loadFromGraph() {
  if (!state.clientId) {
    renderConfigState();
    return;
  }

  setBusy(true);
  showStatus('info', t(state.lang, 'status.loading'), '', 0);

  try {
    const data = await fetchTodoData({
      getToken: () => getAccessToken(state.clientId),
      includeChecklist: true,
      includeCompleted: true,
      lang: state.lang,
      onProgress: ({ message, ratio }) => {
        showStatus('info', message, typeof ratio === 'number' ? `${Math.round(ratio * 100)}%` : '', ratio);
      },
    });

    if (data.stopped && data.lists.length === 0) {
      hideStatus();
      toast(t(state.lang, 'status.stopped'));
      return;
    }

    state.data = data;
    hideStatus();
    renderData();
    if (data.stopped) {
      toast(t(state.lang, 'status.stopped'));
    } else {
      toast(
        data.lists.length
          ? t(state.lang, 'toasts.loadedTasks', { lists: data.lists.length, tasks: data.lists.reduce((sum, list) => sum + list.tasks.length, 0) })
          : t(state.lang, 'toasts.loaded', { lists: data.lists.length }),
      );
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      hideStatus();
      return;
    }

    if (error.status === 401 || error.status === 403) {
      clearSession();
      renderConfigState();
      showStatus(
        'error',
        t(state.lang, 'errors.accessDenied'),
        t(state.lang, 'errors.accessDeniedHint'),
      );
    } else {
      showStatus('error', t(state.lang, 'errors.load'), error.message);
    }
  } finally {
    setBusy(false);
  }
}

function loadDemo() {
  state.data = buildDemoData(state.lang);
  hideStatus();
  renderData();
  toast(t(state.lang, 'toasts.demo'));
}

/* ------------------------------------------------------------------ */
/* render                                                              */
/* ------------------------------------------------------------------ */

function renderFormats() {
  const wrap = $('formats');
  wrap.innerHTML = exporters
    .map((exporter) => {
      const label = t(state.lang, `formats.${exporter.id}.label`) || exporter.label;
      const description = t(state.lang, `formats.${exporter.id}.description`) || exporter.description;
      return `
      <label class="format" data-format="${escapeHtml(exporter.id)}">
        <input type="checkbox" value="${escapeHtml(exporter.id)}" ${
          state.selected.has(exporter.id) ? 'checked' : ''
        } />
        <span class="format__body">
          <span class="format__name">${escapeHtml(label)}<span class="format__ext">.${escapeHtml(exporter.extension)}</span></span>
          <span class="format__desc">${escapeHtml(description)}</span>
        </span>
      </label>`;
    })
    .join('');

  wrap.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) state.selected.add(checkbox.value);
      else state.selected.delete(checkbox.value);
      updatePreview();
    });
  });
}

function renderConfigState() {
  const hasClientId = Boolean(state.clientId);
  $('setup').hidden = hasClientId;

  const input = $('client-id');
  if (!input.value && hasClientId) input.value = state.clientId;

  const withClientId = hasClientId;
  $('signin-hint').textContent = withClientId
    ? t(state.lang, 'connect.hint.withClient')
    : t(state.lang, 'connect.hint.withoutClient');
  $('btn-change-client').hidden = !hasClientId;

  $('btn-signin').textContent = t(state.lang, 'connect.signIn');
  $('btn-demo').textContent = t(state.lang, 'connect.demo');

  syncButtons();
}

function renderData() {
  const data = state.data;
  if (!data) return;

  $('connect-card').hidden = true;
  $('export-card').hidden = false;

  $('account').hidden = false;
  $('account-name').textContent = data.account?.displayName || t(state.lang, 'account.name');
  $('account-mail').textContent = [
    data.account?.username,
    data.account?.source === 'demo' ? t(state.lang, 'account.demo') : '',
  ].filter(Boolean).join(' · ');

  const total = data.lists.reduce((sum, list) => sum + list.tasks.length, 0);
  const done = data.lists.reduce(
    (sum, list) => sum + list.tasks.filter((task) => task.status === 'completed').length,
    0,
  );

  $('stat-lists').textContent = String(data.lists.length);
  $('stat-tasks').textContent = String(total);
  $('stat-done').textContent = String(done);
  $('stat-open').textContent = String(total - done);
  const listsWord = state.lang === 'en' ? (data.lists.length === 1 ? 'list' : 'lists') : (data.lists.length === 1 ? 'lista' : 'liste');
  const tasksWord = state.lang === 'en' ? (total === 1 ? 'task' : 'tasks') : (total === 1 ? 'zadatak' : 'zadataka');
  $('data-pill').textContent = `${data.lists.length} ${listsWord} · ${total} ${tasksWord}`;

  renderListsTable();
  translateDocument(state.lang);
  updatePreview();
  syncButtons();
}

function renderListsTable() {
  const data = state.data;
  const rows = data.lists
    .map((list) => {
      const done = list.tasks.filter((task) => task.status === 'completed').length;
      const open = list.tasks.length - done;
      return `<tr>
        <td>${escapeHtml(list.name)}${list.isShared ? ` <span class="muted">${t(state.lang, 'labels.shared')}</span>` : ''}</td>
        <td class="num">${list.tasks.length}</td>
        <td class="num num--good">${done}</td>
        <td class="num">${open}</td>
      </tr>`;
    })
    .join('');

  $('lists').innerHTML = `<table>
    <thead>
      <tr>
        <th data-i18n="export.tables.list">Lista</th>
        <th class="num" data-i18n="export.tables.total">Ukupno</th>
        <th class="num" data-i18n="export.tables.done">Završeno</th>
        <th class="num" data-i18n="export.tables.open">Otvoreno</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function readOptions() {
  return {
    includeCompleted: $('opt-completed').checked,
    includeChecklist: $('opt-checklist').checked,
    includeNotes: $('opt-notes').checked,
  };
}

function updatePreview() {
  updateExportButton();
  if (!state.data) return;

  const preview = $('preview');
  const label = $('preview-label');
  const exporter = exporters.find((item) => state.selected.has(item.id));

  if (!exporter) {
    label.textContent = '';
    preview.textContent = t(state.lang, 'export.preview.empty');
    return;
  }

  label.textContent = `(${t(state.lang, 'export.preview.format')})`;

  let text;
  try {
    text = exporter.build(state.data, { ...readOptions(), lang: state.lang });
  } catch (error) {
    preview.textContent = `${t(state.lang, 'errors.load')}: ${error.message}`;
    return;
  }

  const limit = 6000;
  preview.textContent = text.length > limit ? `${text.slice(0, limit)}\n\n${t(state.lang, 'export.preview.truncated')}` : text;
}

function updateExportButton() {
  const count = state.selected.size;
  const button = $('btn-export');
  button.textContent = count > 1 ? t(state.lang, 'export.buttonMany', { n: count }) : t(state.lang, 'export.buttonSingle');
}

/* ------------------------------------------------------------------ */
/* akcije                                                             */
/* ------------------------------------------------------------------ */

async function signIn() {
  if (!state.clientId) {
    $('client-id').focus();
    toast(t(state.lang, 'toasts.noClient'));
    return;
  }

  try {
    setBusy(true);
    await beginLogin(state.clientId, getRedirectUri());
  } catch (error) {
    setBusy(false);
    showStatus('error', t(state.lang, 'errors.start'), error.message);
  }
}

function saveClient() {
  const value = $('client-id').value.trim();

  if (!value) {
    toast(t(state.lang, 'toasts.noClient'));
    return;
  }

  if (!/^[0-9a-f-]{30,}$/i.test(value)) {
    toast(t(state.lang, 'toasts.invalidClient'));
    return;
  }

  state.clientId = setClientId(value);
  renderConfigState();
  toast(t(state.lang, 'toasts.saved'));
}

async function exportSelected() {
  if (!state.data) return;

  const chosen = exporters.filter((exporter) => state.selected.has(exporter.id));
  if (!chosen.length) {
    toast(t(state.lang, 'toasts.exportEmpty'));
    return;
  }

  const options = { ...readOptions(), lang: state.lang };
  const date = new Date().toISOString().slice(0, 10);
  const base = safeFilename(`ms-todo-${state.data.account?.username || 'export'}-${date}`);

  setBusy(true);
  try {
    const files = chosen.map((exporter) => ({
      name: `${base}.${exporter.extension}`,
      data: exporter.build(state.data, options),
      mime: exporter.mime,
    }));

    if (files.length === 1) {
      downloadFile(files[0].name, files[0].data, files[0].mime);
      $('setup').hidden = true;
      toast(t(state.lang, 'toasts.exportSingle'));
    } else {
      downloadFile(`${base}.zip`, createZip(files), 'application/zip');
      $('setup').hidden = true;
      toast(t(state.lang, 'toasts.exportMany', { n: files.length }));
    }
  } catch (error) {
    console.error(error);
    showStatus('error', t(state.lang, 'errors.load'), `${t(state.lang, 'errors.exportFailed')}: ${error.message}`);
  } finally {
    setBusy(false);
  }
}

function handleSignOut() {
  clearSession();
  state.data = null;
  $('export-card').hidden = true;
  $('account').hidden = true;
  $('connect-card').hidden = false;
  hideStatus();
  renderConfigState();
  toast(t(state.lang, 'toasts.signOut'));
}

function startNewSession() {
  clearSession();
  state.data = null;
  $('export-card').hidden = true;
  $('account').hidden = true;
  $('connect-card').hidden = false;
  hideStatus();
  renderConfigState();
  toast(t(state.lang, 'toasts.newSession'));
}

/* ------------------------------------------------------------------ */
/* jezik / tema                                                        */
/* ------------------------------------------------------------------ */

function syncLangSwitch() {
  document.querySelectorAll('#lang-switch [data-lang]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === state.lang);
  });
}

function syncThemeToggle() {
  const button = $('theme-toggle');
  const label = t(state.lang, 'topbar.theme');
  button.setAttribute('aria-label', label);
}

function changeLanguage(lang) {
  if (lang === state.lang) return;
  setLang(lang);
  state.lang = lang;
  translateDocument(lang);
  syncLangSwitch();
  renderFormats();
  renderConfigState();
  updatePreview();
}

/* ------------------------------------------------------------------ */
/* akcije pošto bind                                                   */
/* ------------------------------------------------------------------ */

function bindEvents() {
  $('btn-signin').addEventListener('click', signIn);
  $('btn-demo').addEventListener('click', loadDemo);
  $('btn-save-client').addEventListener('click', saveClient);
  $('btn-change-client').addEventListener('click', () => {
    $('setup').hidden = false;
    $('client-id').focus();
    $('client-id').select();
  });
  $('client-id').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') saveClient();
  });

  $('btn-export').addEventListener('click', exportSelected);
  $('btn-refresh').addEventListener('click', () => {
    if (state.data?.account?.source === 'demo') loadDemo();
    else loadFromGraph();
  });
  $('btn-signout').addEventListener('click', handleSignOut);
  $('btn-new-profile').addEventListener('click', startNewSession);
  $('btn-cancel').addEventListener('click', cancelPending);
  $('btn-stop').addEventListener('click', stopImport);
  $('theme-toggle').addEventListener('click', () => {
    state.theme = setTheme(state.theme === 'dark' ? 'light' : 'dark');
    syncThemeToggle();
  });
  document.querySelectorAll('#lang-switch [data-lang]').forEach((button) => {
    button.addEventListener('click', () => changeLanguage(button.dataset.lang));
  });

  for (const id of ['opt-completed', 'opt-checklist', 'opt-notes']) {
    $(id).addEventListener('change', updatePreview);
  }
}

/* ------------------------------------------------------------------ */
/* UI helpers                                                          */
/* ------------------------------------------------------------------ */

function setBusy(busy) {
  state.busy = busy;
  syncButtons();
}

function syncButtons() {
  const busy = state.busy;
  const hasData = Boolean(state.data);

  $('btn-signin').disabled = busy || !state.clientId;
  $('btn-demo').disabled = busy;
  $('btn-save-client').disabled = busy;
  $('client-id').disabled = busy;
  $('btn-export').disabled = busy || !hasData;
  $('btn-refresh').disabled = busy || !hasData;
  $('btn-signout').disabled = busy || !hasData;
  $('btn-new-profile').disabled = busy;
  $('btn-cancel').disabled = !busy;
  $('btn-stop').disabled = !busy;
}

function showStatus(kind, title, detail = '', ratio) {
  const card = $('status-card');
  card.hidden = false;
  card.classList.toggle('status--error', kind === 'error');
  card.classList.toggle('status--ok', kind === 'ok');
  $('status-title').textContent = title;
  $('status-detail').textContent = detail || '';

  const spinner = $('status-spinner');
  spinner.hidden = kind === 'error';

  const barWrap = $('status-bar-wrap');
  if (typeof ratio === 'number') {
    barWrap.hidden = false;
    $('status-bar').style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  } else {
    barWrap.hidden = true;
    $('status-bar').style.width = '0%';
  }
}

function hideStatus() {
  $('status-card').hidden = true;
}

function toast(message) {
  const element = $('toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    element.hidden = true;
  }, 4000);
}

function updateFooterYear() {
  const element = document.getElementById('footer-year');
  if (!element) return;
  element.textContent = String(new Date().getFullYear());
}
