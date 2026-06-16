import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1lO1R58HMfUIspmpiE-PABHAS9T6K_90qE6F1nIy0dhw/export?format=csv&gid=626967621';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
    return obj;
  }).filter(r => r['Name']);
}

function parseRow(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

function formatSpecies(s) {
  const idx = s.indexOf(',');
  if (idx === -1) return s;
  return s.slice(0, idx).trim() + ' (' + s.slice(idx + 1).trim() + ')';
}

const res = await fetch(SHEET_CSV_URL);
if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`);
const text = await res.text();
const rows = parseCSV(text);

const characters = rows.map(r => ({
  name: r['Name'].replace(/,\s*/g, ' '),
  homeWorld: r['Home World'] || 'Unknown',
  firstAppearance: r['First Appearance'] || 'Unknown',
  species: formatSpecies(r['Species'] || 'Unknown'),
  abilities: r['Abilities/Investiture'] || 'None',
  validFrom: parseInt(r['Valid From'] || '0', 10),
}));

const EPOCH = new Date('2024-01-01');
const TODAY = Math.floor((Date.now() - EPOCH.getTime()) / 86400000);

// Deduplicate by name, prefer most recent validFrom <= TODAY, fallback to earliest future
const byName = new Map();
for (const c of characters) {
  const existing = byName.get(c.name);
  if (!existing) { byName.set(c.name, c); continue; }
  const ePast = existing.validFrom <= TODAY;
  const cPast = c.validFrom <= TODAY;
  if (cPast && ePast) { if (c.validFrom > existing.validFrom) byName.set(c.name, c); }
  else if (cPast && !ePast) { byName.set(c.name, c); }
  else if (!cPast && !ePast) { if (c.validFrom < existing.validFrom) byName.set(c.name, c); }
}

const sortKey = s => s.replace(/['"]/g, '').trim().toLowerCase();
const deduped = [...byName.values()].sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)));
const validAnswers = deduped.filter(c => c.validFrom <= TODAY);

const output = `// Auto-generated from Google Sheets — do not edit manually
// Last synced: ${new Date().toISOString()}

export const CHARACTERS = ${JSON.stringify(deduped, null, 2)};

export const VALID_ANSWERS = ${JSON.stringify(validAnswers, null, 2)};
`;

const __dir = dirname(fileURLToPath(import.meta.url));
const outPath = new URL('../src/data/characters.js', import.meta.url);
writeFileSync(fileURLToPath(outPath), output);
console.log(`Synced ${deduped.length} characters (${validAnswers.length} valid answers)`);
