/**
 * Demo podaci — isti oblik kao rezultat `fetchTodoData`, da svi exporteri
 * rade identično sa pravim podacima i sa izmišljenim podacima.
 */

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateParts(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return {
    ymd: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  };
}

function allDay(daysFromToday) {
  const { ymd } = dateParts(daysFromToday);
  return {
    iso: `${ymd}T00:00:00.000Z`,
    raw: `${ymd}T00:00:00.0000000`,
    timeZone: 'UTC',
    allDay: true,
    floating: false,
  };
}

function at(daysFromToday, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  const iso = date.toISOString();
  return {
    iso,
    raw: iso.replace(/Z$/, ''),
    timeZone: 'UTC',
    allDay: false,
    floating: false,
  };
}

let sequence = 0;

function task({
  title,
  status = 'notStarted',
  importance = 'normal',
  notes = '',
  due = null,
  reminder = null,
  isReminderOn = false,
  completed = null,
  categories = [],
  checklist = [],
}) {
  sequence += 1;
  return {
    id: `demo-task-${sequence}`,
    title,
    status,
    importance,
    notes,
    due,
    reminder,
    isReminderOn,
    created: at(-12, 9).iso,
    modified: at(-1, 18).iso,
    completed,
    categories,
    checklist: checklist.map((item, index) => {
      const normalized = typeof item === 'string' ? { text: item, checked: false } : item;
      return {
        id: `demo-check-${sequence}-${index}`,
        text: normalized.text,
        checked: Boolean(normalized.checked),
      };
    }),
  };
}

function demoLists(lang) {
  if (lang === 'en') {
    return [
      {
        id: 'demo-list-personal',
        name: 'Personal',
        wellknownListName: 'defaultList',
        isOwner: true,
        isShared: false,
        tasks: [
          task({
            title: 'Buy groceries',
            status: 'inProgress',
            importance: 'high',
            due: allDay(1),
            reminder: at(1, 9),
            isReminderOn: true,
            notes: 'Pharmacy is next to the market — grab vitamins too.',
            checklist: [
              { text: 'Milk', checked: true },
              { text: 'Bread', checked: true },
              { text: 'Eggs' },
              { text: 'Fruit' },
            ],
          }),
          task({
            title: 'Book car service',
            due: allDay(5),
            reminder: at(4, 10),
            isReminderOn: true,
            notes: 'Ask for prices for the small and the big service.',
          }),
          task({
            title: 'Read 20 pages',
            importance: 'low',
          }),
          task({
            title: 'Call grandma',
            status: 'completed',
            completed: at(-1, 19, 30),
          }),
        ],
      },
      {
        id: 'demo-list-work',
        name: 'Work',
        wellknownListName: 'none',
        isOwner: true,
        isShared: true,
        tasks: [
          task({
            title: 'Send Q4 report',
            status: 'inProgress',
            importance: 'high',
            due: at(2, 17),
            reminder: at(2, 15),
            isReminderOn: true,
            categories: ['Reports', 'Priority'],
            notes: 'Missing numbers for October.\nContact: marko@example.com',
            checklist: [
              { text: 'Prepare tables', checked: true },
              { text: 'Check numbers with finance' },
              { text: 'Send for approval' },
            ],
          }),
          task({
            title: 'Team meeting',
            due: at(1, 10),
            reminder: at(1, 9, 45),
            isReminderOn: true,
            notes: 'Daily standup: sprint, blockers, plan for next week.',
          }),
          task({
            title: 'Update technical documentation',
            status: 'deferred',
            importance: 'low',
            due: allDay(9),
          }),
          task({
            title: 'Review PR #142',
            status: 'completed',
            importance: 'high',
            completed: at(-2, 16, 20),
          }),
        ],
      },
      {
        id: 'demo-list-ideas',
        name: 'Ideas',
        wellknownListName: 'none',
        isOwner: true,
        isShared: false,
        tasks: [
          task({
            title: 'App for exporting To Do lists',
            notes: 'Static page + Microsoft Graph + PKCE. No backend.',
          }),
          task({
            title: 'Weekend plan',
            checklist: ['Planning', 'Book a retreat', 'Charge the camera'],
          }),
        ],
      },
    ];
  }

  return [
    {
      id: 'demo-list-personal',
      name: 'Lično',
      wellknownListName: 'defaultList',
      isOwner: true,
      isShared: false,
      tasks: [
        task({
          title: 'Kupiti namirnice',
          status: 'inProgress',
          importance: 'high',
          due: allDay(1),
          reminder: at(1, 9),
          isReminderOn: true,
          notes: 'Apoteka je pored marketa — uspeti i vitamine.',
          checklist: [
            { text: 'Mleko', checked: true },
            { text: 'Hleb', checked: true },
            { text: 'Jaja' },
            { text: 'Voće' },
          ],
        }),
        task({
          title: 'Zakazati servis za auto',
          due: allDay(5),
          reminder: at(4, 10),
          isReminderOn: true,
          notes: 'Pitati za cenu malog i velikog servisa.',
        }),
        task({
          title: 'Pročitati 20 strana',
          importance: 'low',
        }),
        task({
          title: 'Pozvati baku',
          status: 'completed',
          completed: at(-1, 19, 30),
        }),
      ],
    },
    {
      id: 'demo-list-work',
      name: 'Posao',
      wellknownListName: 'none',
      isOwner: true,
      isShared: true,
      tasks: [
        task({
          title: 'Poslati izveštaj za Q4',
          status: 'inProgress',
          importance: 'high',
          due: at(2, 17),
          reminder: at(2, 15),
          isReminderOn: true,
          categories: ['Izveštaji', 'Prioritet'],
          notes: 'Fale brojevi za oktobar.\nKontakt: marko@example.com',
          checklist: [
            { text: 'Pripremiti tabele', checked: true },
            { text: 'Proveriti brojeve sa finansijama' },
            { text: 'Poslati na odobrenje' },
          ],
        }),
        task({
          title: 'Sastanak sa timom',
          due: at(1, 10),
          reminder: at(1, 9, 45),
          isReminderOn: true,
          notes: 'Dnevni red: sprint, blokade, plan za sledeću nedelju.',
        }),
        task({
          title: 'Ažurirati tehničku dokumentaciju',
          status: 'deferred',
          importance: 'low',
          due: allDay(9),
        }),
        task({
          title: 'Review PR #142',
          status: 'completed',
          importance: 'high',
          completed: at(-2, 16, 20),
        }),
      ],
    },
    {
      id: 'demo-list-ideas',
      name: 'Ideje',
      wellknownListName: 'none',
      isOwner: true,
      isShared: false,
      tasks: [
        task({
          title: 'Aplikacija za export To Do listi',
          notes: 'Statična stranica + Microsoft Graph + PKCE. Bez backend-a.',
        }),
        task({
          title: 'Vikend plan',
          checklist: ['Planinjenje', 'Rezervisati smeštaj', 'Napuniti kameru'],
        }),
      ],
    },
  ];
}

export function buildDemoData(lang = 'sr') {
  sequence = 0;
  const lists = demoLists(lang);

  return {
    exportedAt: new Date().toISOString(),
    account: {
      displayName: lang === 'en' ? 'Demo user' : 'Demo korisnik',
      username: 'demo@example.com',
      source: 'demo',
    },
    lists,
  };
}
