// Content check — runs on every pull request and locally:  node core/validate.mjs
// Fails when: JSON is broken · a language misses a key that English has (or has extra ones)
// · {{var}} doesn't exist · a price/percent is typed into text instead of coming from data
// · non-compliant wording appears · a page fails to build.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, config, loadMarket, buildVars, pagesList, renderPage } from './build.mjs';

const errors = [];
const warnings = [];
const MASTER = 'en';
const LANGS = [...new Set(config.markets.flatMap((m) => loadMarket(m).languages))];

const BANNED = {
  all: [/profit split/i, /\bprofits?\b/i, /real money/i, /our capital/i, /guarantee/i, /get rich/i, /invest(ing|ment)? (with|in) us/i, /\breturns?\b/i],
  fa: [/سود/, /تضمین/],          // "profit", "guarantee" — use پاداش / سهم پاداش
  am: [/ትርፍ/, /ዋስትና ያለው/]      // "profit", "guaranteed" — use ሽልማት
};
// Legal text may name these words in order to deny them
const LEGAL = new Set(['footer:risk']);
const HARD_NUMBER = /(\$\s?\d|\d\s?%|\d+\s?K\b)/;

const readJson = (rel) => {
  try { return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')); }
  catch (e) { errors.push(`Broken JSON: ${rel} — ${e.message}`); return null; }
};
const flatten = (o, pre = '', out = {}) => {
  for (const [k, v] of Object.entries(o || {})) {
    const key = pre ? `${pre}.${k}` : k;
    if (Array.isArray(v)) { out[key] = { len: v.length }; v.forEach((x, i) => (x && typeof x === 'object' ? flatten(x, `${key}.${i}`, out) : (out[`${key}.${i}`] = x))); }
    else if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = v;
  }
  return out;
};

const allVars = Object.assign({}, ...config.markets.map((m) => buildVars(loadMarket(m))));
const groups = [
  ...config.sections.map((s) => ({ name: s, dir: `sections/${s}/i18n` })),
  ...config.offerPackages.map((p) => ({ name: `packages/${p}`, dir: `packages/${p}/i18n` }))
];

function checkText(group, lang, flat) {
  for (const [k, v] of Object.entries(flat)) {
    if (typeof v !== 'string') continue;
    for (const m of v.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) if (allVars[m[1]] === undefined) errors.push(`[${lang}] ${group} → ${k}: {{${m[1]}}} does not exist`);
    if (HARD_NUMBER.test(v.replace(/\{\{[^}]+\}\}/g, ''))) errors.push(`[${lang}] ${group} → ${k}: price/percent typed into text — use a {{var}}: "${v.slice(0, 70)}"`);
    if (!LEGAL.has(`${group}:${k}`)) for (const b of [...BANNED.all, ...(BANNED[lang] || [])]) if (b.test(v)) errors.push(`[${lang}] ${group} → ${k}: non-compliant wording ${b} — see CONTRIBUTING.md › Compliance`);
  }
}

for (const g of groups) {
  if (!existsSync(join(ROOT, g.dir, MASTER + '.json'))) { errors.push(`${g.name}: missing English file`); continue; }
  const master = flatten(readJson(`${g.dir}/${MASTER}.json`));
  for (const lang of LANGS) {
    if (!existsSync(join(ROOT, g.dir, lang + '.json'))) { errors.push(`[${lang}] ${g.name}: missing file ${g.dir}/${lang}.json`); continue; }
    const data = readJson(`${g.dir}/${lang}.json`);
    if (!data) continue;
    const flat = flatten(data);
    for (const k of Object.keys(master)) {
      if (!(k in flat)) errors.push(`[${lang}] ${g.name}: missing "${k}"`);
      else if (master[k] && master[k].len !== undefined && flat[k].len !== master[k].len) errors.push(`[${lang}] ${g.name}: "${k}" has ${flat[k].len} items, English has ${master[k].len}`);
      else if (lang !== MASTER && typeof master[k] === 'string' && master[k].length > 20 && flat[k] === master[k]) warnings.push(`[${lang}] ${g.name} → ${k}: same as English — not translated?`);
    }
    for (const k of Object.keys(flat)) if (!(k in master)) errors.push(`[${lang}] ${g.name}: extra key "${k}" — add it to English first`);
    checkText(g.name, lang, flat);
  }
}

// Market overrides may only change keys that exist in the section text
for (const id of config.markets) {
  const m = loadMarket(id);
  for (const lang of m.languages) {
    for (const [section, keys] of Object.entries(m.i18n[lang] || {})) {
      if (section === 'meta') continue;
      const base = flatten(readJson(`sections/${section}/i18n/${lang}.json`) || {});
      const flat = flatten(keys);
      for (const k of Object.keys(flat)) if (!(k in base)) errors.push(`markets/${id}/i18n/${lang}.json: "${section}.${k}" doesn't exist in sections/${section}`);
      checkText(section, lang, flat);
    }
  }
}

// Every page must build
for (const page of pagesList()) {
  try { renderPage(page); } catch (e) { errors.push(`Build failed for ${page.out}: ${e.message}`); }
}

if (warnings.length) console.log('Warnings:\n  ' + warnings.join('\n  '));
if (errors.length) { console.error(`\n✗ ${errors.length} problem(s):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log(`✓ Content OK — languages: ${LANGS.join(', ')} · pages: ${pagesList().map((p) => p.out).join(', ')}`);
