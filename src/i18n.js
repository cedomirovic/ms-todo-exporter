/**
 * Sadržaj za srpski (default) i engleski jezik. Ključi su dotted paths,
 * npr. "connect.title", "formats.json.label", "labels.status.completed".
 */

export const LANGS = ['sr', 'en'];
export const DEFAULT_LANG = 'en';
export const LANG_KEY = 'mstodo.lang';

const dict = {
  sr: {
    app: {
      title: 'Microsoft ToDo Export',
      tagline: 'Izvezi svoje liste u format koji ti treba. Podaci ne napuštaju tvoj browser.',
    },
    topbar: {
      signOut: 'Odjavi se',
      changeClient: 'Promeni client ID',
      newProfile: 'Novi profil',
      language: 'Jezik',
      theme: 'Promijeni temu',
    },
    account: {
      name: 'Nalog',
      demo: 'demo podaci',
    },
    connect: {
      kicker: 'Besplatno, svi podaci ostaju kod tebe.',
      title: 'Sve tvoje Microsoft To Do<br><span class="hl">zadatke</span>, eksportuj u bilo kom formatu.',
      sub: 'Povezi nalog, učitaj svoje zadatke i preuzmi ih u jednom od šest formata - JSON, Markdown, CSV, HTML, ICS ili TXT. Prijave ide direktno prema Microsoftu.',
      signIn: 'Prijavi se sa Microsoft nalogom',
      demo: 'Probaj demo',
      demoLink: 'Demo link',
      setup: {
        title: 'Podešavanje (jednom)',
        label: 'Application (client) ID',
        save: 'Sačuvaj',
        help: 'Kako da dobiješ client ID (2 minuta)',
        note: 'Client ID nije tajna — normalno je da stoji u config.js i da ga vidi svako. Tajna je samo ono što korisnik odobri svojim loginom.',
        s1: 'Otvori <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" target="_blank" rel="noreferrer">Azure Portal → App registrations</a> i klikni <em>New registration</em>.',
        s2: "Naziv, npr. To Do Export. Za <em>Supported account types</em> izaberi <em>Accounts in any organizational directory and personal Microsoft accounts</em>.",
        s3: 'Pod <em>Redirect URI</em> izaberi platformu <strong>Single-page application (SPA)</strong> i upiši tačno ovu adresu: <code class="js-redirect">—</code>',
        s4: 'Klikni <em>Register</em> i kopiraj <strong>Application (client) ID</strong> ovde gore.',
        s5: "U <em>API permissions</em> dodaj Microsoft Graph → Delegated → <code>Tasks.Read</code> i <code>User.Read</code>.",
      },
      hint: {
        withClient: 'Prijava se otvara na Microsoft stranici. Aplikacija traži samo čitanje. Za poslovne nalove, potrebno je odobrenje lokalnog IT odeljenja.',
        withoutClient: 'Prvo unesi client ID da bi prijava radila. Demo radi odmah.',
      },
    },
    status: {
      loading: 'Povezujem se sa Microsoft To Do…',
      loadingProfile: 'Učitavam profil…',
      loadingLists: 'Učitavam liste…',
      loadingTasks: 'Učitavam zadatke za {name}…',
      loadingChecklist: 'Učitavam podzadatke za {name}…',
      done: 'Gotovo — {lists} listi, {tasks} zadataka.',
      stopped: 'Import je zaustavljen.',
      cancel: 'Preskoči listu',
      stop: 'Stop',
    },
    export: {
      step: 'Korak 2 · Izaberi format',
      readOnly: 'samo čitanje',
      stats: { lists: 'Liste', tasks: 'Zadaci', done: 'Završeno', open: 'Otvoreno', overdue: 'Sa rokom' },
      tables: { list: 'Liste', total: 'Ukupno', done: 'Završeno', open: 'Otvoreno' },
      buttonSingle: 'Preuzmi odabrano',
      buttonMany: 'Preuzmi {n} formata (ZIP)',
      exportEmpty: 'Izaberi bar jedan format.',
      exportSingleDone: 'Fajl je preuzet.',
      exportManyDone: 'Preuzeto {n} formata u jedan ZIP fajl.',
      refresh: 'Osveži podatke',
      preview: { title: 'Pregled sadržaja', format: 'Format', empty: 'Izaberi bar jedan format za pregled.', truncated: '… (skraćeno za pregled)' },
    },
    formats: {
      json: { label: 'JSON', description: 'Kompletan backup: sva polja, podzadaci i datumi. Idealno za ponovni uvoz.' },
      markdown: { label: 'Markdown', description: 'Čitljive liste sa checkbox-ima. Lepo za Notion, Obsidian ili GitHub.' },
      csv: { label: 'CSV', description: 'Tabela za Excel ili Google Sheets, sa UTF-8 BOM.' },
      html: { label: 'HTML', description: 'Jedna samostalna stranica sa svim listama. Za čitanje, štampu ili deljenje.' },
      ics: { label: 'ICS kalendar', description: 'Zadaci sa rokom kao događaji. Uvoz u Outlook, Google ili Apple kalendar.' },
      txt: { label: 'TXT', description: 'Čist tekst bez ikakvog formatiranja. Za mejl, terminal ili brzi pregled.' },
    },
    options: {
      completed: 'Uključi završene zadatke',
      checklist: 'Uključi podzadatke',
      notes: 'Uključi beleške',
    },
    labels: {
      list: 'Lista',
      task: 'Zadatak',
      shared: 'Deljena',
      status: {
        notStarted: 'Nije početo',
        inProgress: 'U toku',
        completed: 'Završeno',
        waitingOnOthers: 'Čeka druge',
        deferred: 'Odloženo',
      },
      importance: { low: 'Niska', normal: 'Normalna', high: 'Visoka' },
      taskStatus: 'Status',
      taskImportance: 'Važnost',
      due: 'Rok',
      reminder: 'Podsetnik',
      completed: 'Završeno',
      notes: 'Beleška',
      checklist: 'Podzadaci',
      tags: 'Oznake',
      created: 'Kreirano',
      modified: 'Izmenjeno',
    },
    note: {
      title: 'Kako radi',
      items: [
        'Prijava ide direktno na Microsoft (login.microsoftonline.com) preko OAuth 2.0 + PKCE. Lozinka nikad ne prolazi kroz ovu aplikaciju.',
        'Podaci se čitaju Microsoft Graph API-jem i obrađuju lokalno u browseru. Nema backend-a ni baze.',
        'Access token se čuva u sessionStorage i nestaje kada zatvoriš tab.',
        'Svi datumi se normalizuju prema UTC-u i vracaju u tvojoj vremenskoj zoni.',
        'Microsoft je oficialno objavio da se Microsoft To Do gasi — aplikacije će stati 30. juna 2027. Sledeći korak: preuzmi svoje zadatke prema nekom formatu. <a href="https://support.microsoft.com/en-au/planner/to-do-to-planner" target="_blank" rel="noreferrer">Službena objava</a>',
      ],
    },
    footer: {
      privacy: 'Bez kolačica za praćenje · bez analitike · <a href="https://github.com/cedomirovic/ms-todo-exporter/blob/main/LICENSE" target="_blank" rel="noreferrer">otvoren kod</a>',
      createdBy: 'Napravljeno od Growit',
    },
    toasts: {
      loaded: 'Učitano: {lists} listi.',
      loadedTasks: 'Učitano: {lists} listi, {tasks} zadataka.',
      demo: 'Demo podaci su učitani — ništa se ne šalje Microsoftu.',
      signOut: 'Odjavljen si. Podaci su uklonjeni iz ovog taba.',
      exportSingle: 'Fajl je preuzet.',
      exportMany: 'Preuzeto {n} formata u jedan ZIP fajl.',
      exportEmpty: 'Izaberi bar jedan format.',
      noClient: 'Nalepi client ID prvo.',
      saved: 'Client ID je sačuvan.',
      invalidClient: 'Client ID izgleda kao GUID, npr. 12345678-abcd-1234-efgh-1234567890ab.',
      newSession: 'Nova sesija. Prijavi se da ucitash novi profil.',
      exportFailed: 'Izvoz nije uspeo',
    },
    errors: {
      start: 'Ne mogu da započnem prijavu',
      loginFailed: 'Prijava nije uspela',
      load: 'Ne mogu da učitam podatke',
      accessDenied: 'Pristup je odbijen',
      accessDeniedHint: 'Prijavi se ponovo. Ako si na poslovnom nalogu, administrator tenanta mora da odobri Tasks.Read.',
      notSupported: 'Otvori preko http:// ili https:// adrese.',
    },
    md: {
      title: 'Microsoft To Do — export',
      metaAccount: 'Nalog: {name} ({username})',
      metaExported: 'Izvezeno: {date}',
      metaTotal: 'Ukupno: {total} zadataka u {lists} listi — {done} završeno, {open} otvoreno',
      listHeader: '{name} — {count} zadataka · {done} završeno',
      generated: 'Generisano: {date}',
      taskCount: '{count} zadataka · {done} završeno',
    },
    csv: {
      columns: {
        list: 'Lista',
        task: 'Zadatak',
        status: 'Status',
        importance: 'Važnost',
        due: 'Rok',
        reminder: 'Podsetnik',
        created: 'Kreirano',
        completed: 'Završeno',
        checklist: 'Podzadaci',
        tags: 'Oznake',
        notes: 'Beleška',
      },
    },
    ics: {
      title: 'Microsoft To Do — export',
      description: 'Izvezeno {date} · {done} od {total} zadataka ima rok',
    },
    txt: {
      title: 'Microsoft To Do — izveštaj',
      metaAccount: 'Nalog: {name} ({username})',
      metaExported: 'Izvezeno: {date}',
      metaTotal: 'Ukupno: {total} zadataka u {lists} listi — {done} završeno, {open} otvoreno',
      listHeader: '{name}  ·  {count} zadataka · {done} završeno',
      empty: 'Nema zadataka za izabrane opcije.',
      generated: 'Generisano u browseru · podaci nisu poslati na server',
    },
  },

  en: {
    app: {
      title: 'Microsoft To Do Export',
      tagline: 'Export your lists into the format you need. Your data never leaves your browser.',
    },
    topbar: {
      signOut: 'Sign out',
      changeClient: 'Change client ID',
      newProfile: 'New profile',
      language: 'Language',
      theme: 'Toggle theme',
    },
    account: {
      name: 'Account',
      demo: 'demo data',
    },
    connect: {
      kicker: 'Free, all data stays with you.',
      title: 'All your Microsoft To Do<br><span class="hl">tasks</span>, export to any format.',
      sub: 'Connect your account, load your tasks and export them into one of six formats - JSON, Markdown, CSV, HTML, ICS or TXT. Sign-in goes directly to Microsoft.',
      signIn: 'Sign in with Microsoft account',
      demo: 'Try the demo',
      demoLink: 'Demo link',
      setup: {
        title: 'One-time setup',
        label: 'Application (client) ID',
        save: 'Save',
        help: 'How to get a client ID (2 minutes)',
        note: 'The client ID is not secret — it is normal that it lives in config.js and is visible to anyone. The secret is only the consent the user grants.',
        s1: 'Open <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" target="_blank" rel="noreferrer">Azure Portal → App registrations</a> and click <em>New registration</em>.',
        s2: 'Give it a name, e.g. To Do Export. For <em>Supported account types</em> choose <em>Accounts in any organizational directory and personal Microsoft accounts</em>.',
        s3: 'Under <em>Redirect URI</em> pick platform <strong>Single-page application (SPA)</strong> and enter this exact address: <code class="js-redirect">—</code>',
        s4: 'Click <em>Register</em> and copy the <strong>Application (client) ID</strong> here.',
        s5: 'Under <em>API permissions</em> add Microsoft Graph → Delegated → <code>Tasks.Read</code> and <code>User.Read</code>.',
      },
      hint: {
        withClient: 'The sign-in opens on Microsoft\'s site. The app only requests read access. For corporate accounts, local IT department approval is required.',
        withoutClient: 'Enter a client ID first so that sign-in can work. The demo works immediately.',
      },
    },
    status: {
      loading: 'Connecting to Microsoft To Do…',
      loadingProfile: 'Loading your profile…',
      loadingLists: 'Loading your lists…',
      loadingTasks: 'Loading tasks for {name}…',
      loadingChecklist: 'Loading subtasks for {name}…',
      done: 'Done — {lists} lists, {tasks} tasks.',
      stopped: 'Import stopped.',
      cancel: 'Skip this list',
      stop: 'Stop import',
    },
    export: {
      step: 'Step 2 · Choose a format',
      readOnly: 'read only',
      stats: { lists: 'Lists', tasks: 'Tasks', done: 'Done', open: 'Open', overdue: 'Overdue' },
      tables: { list: 'Lists', total: 'Total', done: 'Done', open: 'Open' },
      buttonSingle: 'Export selected',
      buttonMany: 'Export {n} formats (ZIP)',
      exportEmpty: 'Select at least one format.',
      exportSingleDone: 'File exported.',
      exportManyDone: 'Exported {n} formats into one ZIP file.',
      refresh: 'Refresh data',
      preview: { title: 'Content preview', format: 'Format', empty: 'Select a format to preview.', truncated: '… (truncated for preview)' },
    },
    formats: {
      json: { label: 'JSON', description: 'Complete backup: all fields, subtasks and dates. Ideal for re-import.' },
      markdown: { label: 'Markdown', description: 'Readable lists with checkboxes. Nice for Notion, Obsidian or GitHub.' },
      csv: { label: 'CSV', description: 'A table for Excel or Google Sheets, with UTF-8 BOM.' },
      html: { label: 'HTML', description: 'One standalone page with all lists. For reading, printing or sharing.' },
      ics: { label: 'ICS calendar', description: 'Tasks as events with due dates. Import into Outlook, Google or Apple Calendar.' },
      txt: { label: 'TXT', description: 'Plain text without any formatting. For email, terminal or quick review.' },
    },
    options: {
      completed: 'Include completed tasks',
      checklist: 'Include subtasks',
      notes: 'Include notes',
    },
    labels: {
      list: 'List',
      task: 'Task',
      shared: 'Shared',
      status: {
        notStarted: 'Not started',
        inProgress: 'In progress',
        completed: 'Completed',
        waitingOnOthers: 'Waiting on others',
        deferred: 'Deferred',
      },
      importance: { low: 'Low', normal: 'Normal', high: 'High' },
      taskStatus: 'Status',
      taskImportance: 'Importance',
      due: 'Due',
      reminder: 'Reminder',
      completed: 'Completed',
      notes: 'Notes',
      checklist: 'Subtasks',
      tags: 'Tags',
      created: 'Created',
      modified: 'Modified',
    },
    note: {
      title: 'How it works',
      items: [
        'Sign-in goes directly to Microsoft (login.microsoftonline.com) via OAuth 2.0 + PKCE. The password never passes through this app.',
        'Data is read from the Microsoft Graph API and processed locally in the browser. No backend, no database.',
        'The access token is kept in sessionStorage and disappears when the tab closes.',
        'All dates are normalized to UTC and converted back to your local timezone.',
        'Microsoft officially announced that Microsoft To Do is shutting down — the apps will be retired on June 30, 2027. Next step: export your tasks to another format. <a href="https://support.microsoft.com/en-au/planner/to-do-to-planner" target="_blank" rel="noreferrer">Official announcement</a>',
      ],
    },
    footer: {
      privacy: 'No tracking cookies · no analytics · <a href="https://github.com/cedomirovic/ms-todo-exporter/blob/main/LICENSE" target="_blank" rel="noreferrer">open source</a>',
      createdBy: 'Created by Growit',
    },
    toasts: {
      loaded: 'Loaded: {lists} lists.',
      loadedTasks: 'Loaded: {lists} lists, {tasks} tasks.',
      demo: 'Demo data loaded — nothing was sent to Microsoft.',
      signOut: 'You have been signed out. Data was removed from this tab.',
      exportSingle: 'File exported.',
      exportMany: 'Exported {n} formats into one ZIP file.',
      exportEmpty: 'Select at least one format.',
      noClient: 'Enter a client ID first.',
      saved: 'Client ID saved.',
      invalidClient: 'Client ID looks like a GUID, e.g. 12345678-abcd-1234-efgh-1234567890ab.',
      newSession: 'New session. Sign in to load a new profile.',
      exportFailed: 'Export failed',
    },
    errors: {
      start: 'Could not start the sign-in',
      loginFailed: 'Sign-in failed',
      load: 'Could not load your data',
      accessDenied: 'Access was denied',
      accessDeniedHint: 'Sign in again. If you are on a corporate account, the tenant admin must grant Tasks.Read.',
      notSupported: 'Open this page over http:// or https://.',
      exportFailed: 'Export failed',
    },
    md: {
      title: 'Microsoft To Do — export',
      metaAccount: 'Account: {name} ({username})',
      metaExported: 'Exported: {date}',
      metaTotal: 'Total: {total} tasks in {lists} lists — {done} done, {open} open',
      listHeader: '{name} — {count} tasks · {done} done',
      generated: 'Generated: {date}',
      taskCount: '{count} tasks · {done} done',
    },
    csv: {
      columns: {
        list: 'List',
        task: 'Task',
        status: 'Status',
        importance: 'Importance',
        due: 'Due',
        reminder: 'Reminder',
        created: 'Created',
        completed: 'Completed',
        checklist: 'Subtasks',
        tags: 'Tags',
        notes: 'Notes',
      },
    },
    ics: {
      title: 'Microsoft To Do — export',
      description: 'Exported {date} · {done} of {total} tasks have a due date',
    },
    txt: {
      title: 'Microsoft To Do — export',
      metaAccount: 'Account: {name} ({username})',
      metaExported: 'Exported: {date}',
      metaTotal: 'Total: {total} tasks in {lists} lists — {done} done, {open} open',
      listHeader: '{name}  ·  {count} tasks · {done} done',
      empty: 'No tasks for the selected options.',
      generated: 'Generated in the browser · data was not sent to a server',
    },
  },
};

export function getLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'sr' || stored === 'en') return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

export function setLang(lang) {
  const safe = lang === 'en' ? 'en' : 'sr';
  try {
    localStorage.setItem(LANG_KEY, safe);
  } catch {
    /* ignore */
  }
  return safe;
}

export function toggleLang() {
  return getLang() === 'sr' ? 'en' : 'sr';
}

export function localeFor(lang) {
  return lang === 'en' ? 'en-US' : 'sr-RS';
}

function readDeep(source, key) {
  if (!source) return undefined;
  let value = source;
  for (const part of key.split('.')) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  return value;
}

export function t(lang, key, vars = {}) {
  const language = dict[lang === 'en' ? 'en' : 'sr'];
  let value = readDeep(language, key);
  if (typeof value === 'function') value = value(vars);
  if (typeof value !== 'string') return key;

  let result = value;
  for (const [name, placeholder] of Object.entries(vars || {})) {
    result = result.split(`{${name}}`).join(String(placeholder));
  }
  return result;
}

export function translateDocument(lang) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = t(lang, element.dataset.i18n);
    if (element.dataset.i18nHtml) element.innerHTML = value;
    else element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((element) => {
    element.innerHTML = t(lang, element.dataset.i18nHtml);
  });
  document.querySelectorAll('.js-redirect').forEach((element) => {
    element.textContent = `${window.location.origin}${window.location.pathname}`;
  });
  document.documentElement.lang = lang;
}
