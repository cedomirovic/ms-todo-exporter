import test from 'node:test';
import assert from 'node:assert/strict';

import { exporters, getExporter } from '../src/exporters/index.js';
import { buildDemoData } from '../src/demo.js';
import { stripHtml, parseGraphDateTime } from '../src/graph.js';
import { createZip } from '../src/zip.js';

const data = {
  exportedAt: '2026-11-22T10:00:00.000Z',
  account: {
    displayName: 'Test <Korisnik>',
    username: 'test@example.com',
    source: 'graph',
  },
  lists: [
    {
      id: 'l1',
      name: 'Lično & kuća',
      wellknownListName: 'defaultList',
      isOwner: true,
      isShared: false,
      tasks: [
        {
          id: 't1',
          title: 'Kupiti "mleko", hleb i jaja',
          status: 'notStarted',
          importance: 'high',
          notes: 'Prva linija\nDruga linija',
          due: {
            iso: '2026-11-23T00:00:00.000Z',
            raw: '2026-11-23T00:00:00.0000000',
            allDay: true,
            floating: false,
            timeZone: 'UTC',
          },
          reminder: {
            iso: '2026-11-23T09:00:00.000Z',
            raw: '2026-11-23T09:00:00.0000000',
            allDay: false,
            floating: false,
            timeZone: 'UTC',
          },
          isReminderOn: true,
          created: '2026-11-01T09:00:00Z',
          modified: null,
          completed: null,
          categories: ['Dom'],
          checklist: [
            { text: 'Mleko', checked: true },
            { text: 'Hleb', checked: false },
          ],
        },
        {
          id: 't2',
          title: 'Završen zadatak',
          status: 'completed',
          importance: 'normal',
          notes: '',
          due: null,
          reminder: null,
          isReminderOn: false,
          created: '2026-11-01T09:00:00Z',
          modified: null,
          completed: {
            iso: '2026-11-20T12:00:00.000Z',
            raw: '2026-11-20T12:00:00',
            allDay: false,
            floating: false,
            timeZone: 'UTC',
          },
          categories: [],
          checklist: [],
        },
      ],
    },
    {
      id: 'l2',
      name: 'Posao',
      wellknownListName: 'none',
      isOwner: true,
      isShared: true,
      tasks: [
        {
          id: 't3',
          title: 'Sastanak',
          status: 'inProgress',
          importance: 'normal',
          notes: '',
          due: {
            iso: '2026-11-24T15:00:00.000Z',
            raw: '2026-11-24T15:00:00',
            allDay: false,
            floating: false,
            timeZone: 'UTC',
          },
          reminder: null,
          isReminderOn: false,
          created: '2026-11-02T09:00:00Z',
          modified: null,
          completed: null,
          categories: [],
          checklist: [],
        },
      ],
    },
  ],
};

const defaultOptions = { includeCompleted: true, includeChecklist: true, includeNotes: true, lang: 'sr' };
const totalTasks = data.lists.reduce((sum, list) => sum + list.tasks.length, 0);

test('registar sadrži svih šest formata', () => {
  assert.deepEqual(
    exporters.map((exporter) => exporter.id),
    ['json', 'markdown', 'csv', 'html', 'ics', 'txt'],
  );
  assert.equal(getExporter('markdown').extension, 'md');
  assert.equal(getExporter('nepostoji'), null);
});

test('svaki exporter proizvodi neprazan string', () => {
  for (const exporter of exporters) {
    const output = exporter.build(data, defaultOptions);
    assert.equal(typeof output, 'string', exporter.id);
    assert.ok(output.length > 50, `${exporter.id} je prekratak`);
  }
});

test('JSON je validan i sadrži sve zadatke', () => {
  const parsed = JSON.parse(getExporter('json').build(data, defaultOptions));
  assert.equal(parsed.format, 'ms-todo-export');
  assert.equal(parsed.version, 1);
  assert.equal(parsed.account.username, 'test@example.com');
  assert.equal(parsed.counts.lists, 2);
  assert.equal(parsed.counts.tasks, totalTasks);
  assert.equal(parsed.lists[0].tasks[0].checklist.length, 2);
  assert.equal(parsed.lists[0].tasks[0].due.allDay, true);
});

test('CSV ima BOM, header i ispravno escapovane navodnike', () => {
  const csv = getExporter('csv').build(data, defaultOptions);
  assert.ok(csv.startsWith('\ufeff'), 'nedostaje BOM');
  assert.ok(csv.startsWith('\ufeff"Lista","Zadatak","Status"'));
  assert.ok(csv.includes('"Kupiti ""mleko"", hleb i jaja"'));
  assert.ok(csv.endsWith('\r\n'));

  // Svaki novi red počinje navodnikom; newline unutar ćelije ne počinje tako.
  assert.equal((csv.match(/\r\n"/g) || []).length, totalTasks);
  assert.ok(csv.includes('"Prva linija\r\nDruga linija"'));
});

test('Markdown poštuje checkbox stanje i opcije', () => {
  const markdown = getExporter('markdown').build(data, defaultOptions);
  assert.ok(markdown.includes('- [ ] **Kupiti'));
  assert.ok(markdown.includes('- [x] **Završen zadatak**'));
  assert.ok(markdown.includes('  - Rok:'));
  assert.ok(markdown.includes('    - [x] Mleko'));
  assert.ok(markdown.includes('    > Prva linija'));

  const bezZavrsenih = getExporter('markdown').build(data, {
    ...defaultOptions,
    includeCompleted: false,
  });
  assert.ok(!bezZavrsenih.includes('Završen zadatak'));

  const bezBeloski = getExporter('markdown').build(data, {
    ...defaultOptions,
    includeNotes: false,
  });
  assert.ok(!bezBeloski.includes('Prva linija'));
});

test('HTML je samostalan dokument i escape-uje opasne znakove', () => {
  const html = getExporter('html').build(data, defaultOptions);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('Test &lt;Korisnik&gt;'));
  assert.ok(!html.includes('Test <Korisnik>'));
  assert.ok(html.includes('<input type="checkbox" checked disabled'));
  assert.ok(html.includes('</html>'));
});

test('TXT sadrži markere i detalje', () => {
  const txt = getExporter('txt').build(data, defaultOptions);
  assert.ok(txt.includes('[ ] Kupiti "mleko", hleb i jaja'));
  assert.ok(txt.includes('[x] Završen zadatak'));
  assert.ok(txt.includes('Rok:'));
  assert.ok(txt.includes('Podzadaci:'));
});

test('podrazumevani jezik izvoza je engleski', () => {
  const txt = getExporter('txt').build(data, {
    includeCompleted: true,
    includeChecklist: true,
    includeNotes: true,
  });
  assert.ok(txt.includes('Due:'));
  assert.ok(txt.includes('Subtasks:'));
});

test('ICS je RFC 5545 kompatibilan i filtrira zadatke bez roka', () => {
  const ics = getExporter('ics').build(data, defaultOptions);

  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261123'));
  assert.ok(ics.includes('DTSTART:20261124T150000Z'));
  assert.ok(ics.includes('BEGIN:VALARM'));
  assert.ok(ics.includes('\\,'));
  assert.ok(ics.includes('CATEGORIES:Microsoft To Do,Lično & kuća'));
  assert.ok(ics.includes('STATUS:CONFIRMED'));
  assert.ok(!ics.includes('STATUS:TENTATIVE'));
  assert.ok(!ics.includes('Završen zadatak'), 'zadatak bez roka ne ide u kalendar');

  const bytes = new TextEncoder();
  for (const line of ics.split('\r\n')) {
    assert.ok(bytes.encode(line).length <= 75, `linija predugačka: ${line}`);
  }
});

test('ICS savija veoma dugačke linije bez gubitka sadržaja', () => {
  const longTitle = 'Veoma dugačak naslov '.repeat(12).trim();
  const fixture = structuredClone(data);
  fixture.lists[0].tasks[0].title = longTitle;

  const ics = getExporter('ics').build(fixture, defaultOptions);
  for (const line of ics.split('\r\n')) {
    assert.ok(new TextEncoder().encode(line).length <= 75);
  }

  const unfolded = ics.replace(/\r\n[ \t]/g, '');
  assert.ok(unfolded.includes(longTitle));
});

test('demo podaci imaju isti oblik kao Graph rezultat', () => {
  const demo = buildDemoData();
  assert.equal(demo.lists.length, 3);
  assert.equal(demo.account.source, 'demo');
  assert.ok(demo.lists.every((list) => list.id && list.name && Array.isArray(list.tasks)));
  assert.ok(demo.lists.some((list) => list.tasks.some((task) => task.checklist.length)));

  for (const exporter of exporters) {
    assert.ok(exporter.build(demo, defaultOptions).length > 50, exporter.id);
  }
});

test('stripHtml pretvara HTML beleške u čist tekst', () => {
  assert.equal(stripHtml('<p>Hello<br>world &amp; co</p>'), 'Hello\nworld & co');
  assert.equal(stripHtml('<ul><li>Prvo</li><li>Drugo</li></ul>'), '• Prvo\n• Drugo');
  assert.equal(stripHtml(''), '');
  assert.equal(stripHtml(undefined), '');
});

test('parseGraphDateTime prepoznaje ceo dan i tačno vreme', () => {
  const allDay = parseGraphDateTime({
    dateTime: '2026-11-23T00:00:00.0000000',
    timeZone: 'UTC',
  });
  assert.equal(allDay.allDay, true);
  assert.equal(allDay.iso, '2026-11-23T00:00:00.000Z');

  const timed = parseGraphDateTime({
    dateTime: '2026-11-23T14:30:00.0000000',
    timeZone: 'UTC',
  });
  assert.equal(timed.allDay, false);
  assert.equal(timed.iso, '2026-11-23T14:30:00.000Z');

  assert.equal(parseGraphDateTime(null), null);
  assert.equal(parseGraphDateTime({}), null);
});

test('ZIP sadrži sve fajlove i ispravne potpise', async () => {
  const blob = createZip(
    [
      { name: 'ms-todo.json', data: '{"ok":true}' },
      { name: 'ms-todo.md', data: '# Zdravo\n' },
    ],
    new Date('2026-11-22T10:00:00Z'),
  );

  assert.equal(blob.type, 'application/zip');

  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);

  const text = new TextDecoder('latin1').decode(bytes);
  assert.ok(text.includes('ms-todo.json'));
  assert.ok(text.includes('ms-todo.md'));
  assert.ok(text.includes('PK\x01\x02'), 'nedostaje central directory');
  assert.ok(text.includes('PK\x05\x06'), 'nedostaje EOCD');
});
