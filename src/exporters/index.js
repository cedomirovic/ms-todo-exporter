/** Registar svih formata. Redosled određuje redosled u UI-ju. */

import * as json from './json.js';
import * as markdown from './markdown.js';
import * as csv from './csv.js';
import * as html from './html.js';
import * as ics from './ics.js';
import * as txt from './txt.js';

export const exporters = [json, markdown, csv, html, ics, txt];

export const DEFAULT_FORMAT_IDS = ['json', 'markdown'];

export function getExporter(formatId) {
  return exporters.find((exporter) => exporter.id === formatId) || null;
}
