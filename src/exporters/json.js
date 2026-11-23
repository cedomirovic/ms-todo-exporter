/** JSON — kompletan, gubitak-free zapis svih podataka. */

export const id = 'json';
export const label = 'JSON';
export const description = 'Kompletan backup: sva polja, podzadaci i datumi. Idealno za ponovni uvoz.';
export const extension = 'json';
export const mime = 'application/json';

function dateValue(value) {
  if (!value) return null;
  return {
    iso: value.iso,
    allDay: Boolean(value.allDay),
    floating: Boolean(value.floating),
    timeZone: value.timeZone || 'UTC',
  };
}

export function build(data) {
  const document = {
    format: 'ms-todo-export',
    version: 1,
    exportedAt: data.exportedAt || new Date().toISOString(),
    account: {
      displayName: data.account?.displayName || '',
      username: data.account?.username || '',
      source: data.account?.source || 'graph',
    },
    counts: {
      lists: data.lists.length,
      tasks: data.lists.reduce((sum, list) => sum + list.tasks.length, 0),
    },
    lists: data.lists.map((list) => ({
      id: list.id,
      name: list.name,
      wellknownListName: list.wellknownListName || 'none',
      isOwner: list.isOwner !== false,
      isShared: Boolean(list.isShared),
      tasks: list.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        importance: task.importance,
        notes: task.notes || '',
        due: dateValue(task.due),
        reminder: dateValue(task.reminder),
        isReminderOn: Boolean(task.isReminderOn),
        created: task.created || null,
        modified: task.modified || null,
        completed: task.completed?.iso || null,
        categories: task.categories || [],
        checklist: (task.checklist || []).map((item) => ({
          text: item.text,
          checked: Boolean(item.checked),
        })),
      })),
    })),
  };

  return JSON.stringify(document, null, 2);
}
