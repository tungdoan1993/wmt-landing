// Builds every market/language page into dist/.   Usage: node core/build.mjs
// No dependencies (Node 18+).
//
// Where things come from:
//   site.config.json                  global settings, section order, shared numbers
//   markets/<market>/market.json      Telegram bot, video, URL path, languages
//   markets/<market>/i18n/<lang>.json market-specific text (overrides section text)
//   packages/<pkg>/data.json          sizes and prices        packages/<pkg>/i18n/<lang>.json  package text
//   sections/<name>/section.html      markup                  sections/<name>/i18n/<lang>.json section text
//   sections/<name>/section.css|js    optional, bundled into assets/site.css|js
//
// Template tokens (inside section.html / card.html / item html):
//   {{t:key}}      text from the section's i18n (escaped; **bold**, *highlight*, {{var}} supported)
//   {{a:key}}      same, plain text for attributes
//   {{v:name}}     a variable (shared vars, package vars, market values)
//   {{tg:place}}   Telegram bot link for a placement (hero, popup, ...)
//   {{reg:place}}  registration link for a placement  ({{reg:@name}} = placement taken from value 'name')
//   {{link:name}}  link from site.config.json → links
//   {{icon:name}}  inline SVG icon from core/icons.mjs
//   {{asset:path}} path to a file in assets/
//   {{list:key|file.html}}  repeat file.html for each item of the i18n array "key"
//   {{packages}}   offer cards (offer section only)    {{langSwitch}} {{video}} {{config}}
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from './icons.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const readText = (p) => readFileSync(join(ROOT, p), 'utf8');
const exists = (p) => existsSync(join(ROOT, p));

export const config = readJson('site.config.json');
const RTL = new Set(['fa', 'ar', 'ur']);
const LANG_NAME = { en: 'English', fa: 'فارسی', am: 'አማርኛ' };
const FONTS = {
  base: 'family=Poppins:wght@500;600;700;800&family=Montserrat:wght@400;500;600;700',
  fa: '&family=Vazirmatn:wght@400;500;700;800',
  am: '&family=Noto+Sans+Ethiopic:wght@400;500;700;800'
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (o, path) => (path === '.' ? o && o['.'] : path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o));
const money = (n) => '$' + (n % 1 ? n.toFixed(2) : String(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const merge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = v && typeof v === 'object' && !Array.isArray(v) && a && typeof a[k] === 'object' ? merge(a[k], v) : v;
  return out;
};

export function loadMarket(id) {
  const m = readJson(`markets/${id}/market.json`);
  m.id = id;
  m.i18n = {};
  for (const l of m.languages) m.i18n[l] = exists(`markets/${id}/i18n/${l}.json`) ? readJson(`markets/${id}/i18n/${l}.json`) : {};
  return m;
}
export function loadPackage(id) {
  const p = readJson(`packages/${id}/data.json`);
  p.id = id;
  p.card = readText(`packages/${id}/card.html`);
  p.i18n = (l) => readJson(`packages/${id}/i18n/${l}.json`);
  return p;
}
export const sectionText = (name, lang) => readJson(`sections/${name}/i18n/${lang}.json`);

// Shared variables available as {{name}} in any text
export function buildVars(market) {
  const vars = { ...config.vars };
  const pkgs = config.offerPackages.map(loadPackage);
  for (const p of pkgs) {
    Object.assign(vars, p.vars);
    vars[p.id + 'From'] = money(Math.min(...p.sizes.map((s) => s.price)));
  }
  vars.maxSize = pkgs.flatMap((p) => p.sizes.map((s) => s.label)).sort((a, b) => parseFloat(b.slice(1)) - parseFloat(a.slice(1)))[0];
  vars.videoAmount = market.video.amount;
  return vars;
}

function textToHtml(value, vars, where) {
  if (typeof value !== 'string') throw new Error(`Missing text: ${where}`);
  const holes = value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    if (vars[k] === undefined) throw new Error(`Unknown {{${k}}} in ${where}`);
    return '\u0001' + vars[k] + '\u0002';
  });
  return esc(holes)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\u0001/g, '<bdi class="num">').replace(/\u0002/g, '</bdi>');
}
function textToAttr(value, vars, where) {
  if (typeof value !== 'string') throw new Error(`Missing text: ${where}`);
  return esc(value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    if (vars[k] === undefined) throw new Error(`Unknown {{${k}}} in ${where}`);
    return vars[k];
  }).replace(/\*\*?/g, ''));
}

const relRoot = (out) => '../'.repeat(out.split('/').length - 1);

export function telegramLink(market, lang, place) {
  const tg = market.telegram;
  const code = market.code + (lang === market.languages[0] ? '' : '-' + lang);
  if (tg.bothelpStart) {
    const q = new URLSearchParams({ domain: tg.bot, start: tg.bothelpStart, utm_medium: 'landing', utm_content: place, lp_market: market.code, lp_lang: lang });
    return 'https://r.bothelp.io/tg?' + q.toString();
  }
  return `https://t.me/${tg.bot}?start=lp_${code}_${place}`;
}
export function registerLink(market, lang, place) {
  const q = new URLSearchParams({ utm_source: 'landing', utm_medium: market.code, utm_campaign: 'lp_' + lang, utm_content: place });
  return config.links.register + '?' + q.toString();
}

function render(tpl, ctx, where) {
  return tpl.replace(/\{\{(\w+)(?::([^}|]+)(?:\|([^}]+))?)?\}\}/g, (m, kind, arg, extra) => {
    switch (kind) {
      case 't': return textToHtml(get(ctx.text, arg), ctx.vars, `${where} → ${arg}`);
      case 'a': return textToAttr(get(ctx.text, arg), ctx.vars, `${where} → ${arg}`);
      case 'v': { const v = get(ctx.values, arg); if (v === undefined) throw new Error(`Unknown value ${arg} in ${where}`); return esc(v); }
      case 'tg': return esc(telegramLink(ctx.market, ctx.lang, arg[0] === '@' ? ctx.values[arg.slice(1)] : arg));
      case 'reg': return esc(registerLink(ctx.market, ctx.lang, arg[0] === '@' ? ctx.values[arg.slice(1)] : arg));
      case 'link': { const v = config.links[arg]; if (!v) throw new Error(`Unknown link ${arg}`); return esc(v); }
      case 'icon': if (!ICONS[arg]) throw new Error(`Unknown icon ${arg} in ${where}`); return ICONS[arg];
      case 'asset': return ctx.root + 'assets/' + arg;
      case 'list': {
        const items = get(ctx.text, arg);
        if (!Array.isArray(items)) throw new Error(`${arg} is not a list in ${where}`);
        const itemTpl = readText(`${ctx.dir}/${extra}`);
        return items.map((it, i) => render(itemTpl, { ...ctx, text: typeof it === 'string' ? { '.': it } : it, values: { ...ctx.values, index: i + 1 } }, `${where} → ${arg}[${i}]`)).join('');
      }
      case 'packages': return renderPackages(ctx);
      case 'langSwitch': return renderLangSwitch(ctx);
      case 'video': return renderVideo(ctx);
      default: throw new Error(`Unknown token ${m} in ${where}`);
    }
  });
}

function renderPackages(ctx) {
  const pkgs = config.offerPackages.map(loadPackage);
  const tabs = pkgs.map((p, i) => {
    const t = p.i18n(ctx.lang);
    return `<button type="button" class="tab tab-${p.color}" role="tab" id="tab-${p.id}" aria-controls="pkg-${p.id}" aria-selected="${i === 0}">${esc(t.name)}</button>`;
  }).join('');
  const panels = pkgs.map((p, i) => {
    const t = p.i18n(ctx.lang);
    const cards = p.sizes.map((s, j) => render(p.card, {
      ...ctx, dir: `packages/${p.id}`, text: merge(ctx.text, t),
      values: { ...ctx.values, size: s.label, price: money(s.price), list: s.list ? money(s.list) : '', featured: j === p.featured ? 'is-featured' : '', color: p.color, place: `${p.id}_${s.label.replace('$', '')}` }
    }, `packages/${p.id}/card.html`).replace(/<s class="list num">\s*<\/s>/g, '')).join('');
    return `<div class="pkg-panel" role="tabpanel" id="pkg-${p.id}" aria-labelledby="tab-${p.id}"${i === 0 ? '' : ' hidden'}>
<p class="pkg-lead">${textToHtml(t.lead, ctx.vars, `packages/${p.id} lead`)}</p>
<div class="pkg-grid">${cards}</div></div>`;
  }).join('');
  return `<div class="tabs" role="tablist" aria-label="${textToAttr(ctx.text.tabsLabel, ctx.vars, 'offer tabsLabel')}">${tabs}</div>${panels}`;
}

function renderLangSwitch(ctx) {
  const m = ctx.market;
  return `<nav class="lang-switch" aria-label="${textToAttr(ctx.text.langLabel, ctx.vars, 'header langLabel')}">` + m.languages.map((l) => {
    const href = ctx.root + m.path + '/' + (l === m.languages[0] ? '' : l + '/');
    return `<a href="${href}" lang="${l}" hreflang="${l}"${l === ctx.lang ? ' aria-current="true"' : ''}>${LANG_NAME[l]}</a>`;
  }).join('') + '</nav>';
}

function renderVideo(ctx) {
  // Self-hosted MP4 when market.json → video.file is set (works where YouTube is blocked), else YouTube.
  const v = ctx.market.video;
  const alt = textToAttr(ctx.text.videoCaption, ctx.vars, 'hero videoCaption');
  const label = textToAttr(ctx.text.videoLabel, ctx.vars, 'hero videoLabel');
  const src = v.file ? `data-src="${ctx.root}${esc(v.file)}"` : `data-youtube="${esc(v.youtubeId)}"`;
  const fallback = v.file ? `${ctx.root}${esc(v.file)}` : `https://www.youtube.com/watch?v=${esc(v.youtubeId)}`;
  return `<button type="button" class="video" ${src} aria-label="${label}">
<img src="${ctx.root}${esc(v.thumb)}" alt="${alt}" width="960" height="540" fetchpriority="high">
<span class="play" aria-hidden="true">${ICONS.play}</span></button>
<noscript><a href="${fallback}">${label}</a></noscript>`;
}

function trackingHead() {
  const { gtmId, metaPixelId } = config.tracking;
  let h = '';
  if (gtmId) h += `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${esc(gtmId)}');</script>\n`;
  if (metaPixelId) h += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(metaPixelId)}');fbq('track','PageView');</script>\n`;
  return h;
}

export function pagesList() {
  return config.markets.map(loadMarket).flatMap((m) => m.languages.map((lang) => ({
    market: m, lang, out: `${m.path}/${lang === m.languages[0] ? '' : lang + '/'}index.html`
  })));
}

export function renderPage({ market, lang, out }) {
  const vars = buildVars(market);
  const root = relRoot(out);
  const marketText = market.i18n[lang] || {};
  const values = { ...vars, lang, market: market.code };
  const body = config.sections.map((name) => {
    const dir = `sections/${name}`;
    const text = merge(sectionText(name, lang), marketText[name]);
    return render(readText(`${dir}/section.html`), { market, lang, vars, root, dir, text, values }, `${dir} (${lang})`);
  }).join('\n');
  const meta = merge(readJson(`sections/header/i18n/${lang}.json`).meta, marketText.meta);
  const runtime = {
    lang, market: market.code, popup: config.popup,
    promo: config.promo.enabled ? config.promo : null
  };
  const hreflang = config.siteUrl
    ? market.languages.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(config.siteUrl)}/${market.path}/${l === market.languages[0] ? '' : l + '/'}">`).join('\n')
    : '';
  return `<!doctype html>
<html lang="${lang}" dir="${RTL.has(lang) ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${textToAttr(meta.title, vars, 'meta.title')}</title>
<meta name="description" content="${textToAttr(meta.description, vars, 'meta.description')}">
<meta property="og:title" content="${textToAttr(meta.title, vars, 'meta.title')}">
<meta property="og:description" content="${textToAttr(meta.description, vars, 'meta.description')}">
<meta property="og:image" content="${root}${esc(market.video.thumb)}">
<meta name="theme-color" content="#0C0C0C">
<link rel="icon" href="${root}assets/logo.png">
${hreflang}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${FONTS.base}${FONTS[lang] || ''}&amp;display=swap">
<link rel="stylesheet" href="${root}assets/site.css">
${trackingHead()}</head>
<body>
${body}
<script>window.__WMT__=${JSON.stringify(runtime).replace(/</g, '\\u003c')};</script>
<script src="${root}assets/site.js" defer></script>
</body>
</html>
`;
}

function renderIndex(pages) {
  const markets = config.markets.map(loadMarket);
  const links = markets.map((m) => {
    const h = sectionText('header', m.languages[0]).meta;
    return `<a class="choose" href="${m.path}/" lang="${m.languages[0]}">${LANG_NAME[m.languages[0]]} <span>/ English</span></a>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>WeMasterTrade</title><link rel="icon" href="assets/logo.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${FONTS.base}${FONTS.fa}${FONTS.am}&amp;display=swap"><link rel="stylesheet" href="assets/site.css"></head>
<body class="chooser"><main><img src="assets/logo.png" alt="WeMasterTrade" width="128" height="60"><div class="choose-list">${links}</div></main></body></html>`;
}

function bundle(ext, first) {
  const parts = [readText(first)];
  for (const name of config.sections) if (exists(`sections/${name}/section.${ext}`)) parts.push(`/* ---- sections/${name} ---- */\n` + readText(`sections/${name}/section.${ext}`));
  for (const p of config.offerPackages) if (exists(`packages/${p}/card.${ext}`)) parts.push(`/* ---- packages/${p} ---- */\n` + readText(`packages/${p}/card.${ext}`));
  return parts.join('\n\n');
}

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    const s = join(from, f), d = join(to, f);
    if (statSync(s).isDirectory()) copyDir(s, d); else copyFileSync(s, d);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  const pages = pagesList();
  for (const page of pages) {
    const file = join(DIST, page.out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderPage(page));
    console.log('built', page.out);
  }
  writeFileSync(join(DIST, 'index.html'), renderIndex(pages));
  copyDir(join(ROOT, 'assets'), join(DIST, 'assets'));
  writeFileSync(join(DIST, 'assets/site.css'), bundle('css', 'core/base.css'));
  writeFileSync(join(DIST, 'assets/site.js'), bundle('js', 'core/app.js'));
  console.log('done → dist/');
}
