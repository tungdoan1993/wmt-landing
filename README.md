# WeMasterTrade — conversion landing pages (Farsi/EN · Amharic/EN)

One goal per page: get the visitor into the **Telegram bot** (lead capture → BotHelp sequence) or straight to **registration**.

| Page | Path | Telegram bot |
|---|---|---|
| Farsi (RTL) | `/fa/` | @wmtiran_bot |
| Farsi market, English | `/fa/en/` | @wmtiran_bot |
| Amharic | `/am/` | @wmtethiopia_bot |
| Amharic market, English | `/am/en/` | @wmtethiopia_bot |
| Market chooser | `/` | — |

## Folder map — where to edit what

```
site.config.json            section order, shared numbers (90%, 24h…), links, pop-up, promo bar, GTM/Pixel IDs
markets/
  iran/      market.json    bot, BotHelp start code, payout video, languages   i18n/  market-only text
  ethiopia/  market.json    same for Ethiopia
packages/
  challenge/ data.json      sizes + prices         i18n/ name, bullets      card.html / card.css  the card
  instant/   data.json      sizes + prices (+list price)  i18n/            card.html
sections/                   one folder per block of the page, in page order:
  header/  promo-bar/  hero/  proof/  offer/  steps/  telegram/  faq/  final-cta/  footer/  sticky-bar/  popup/
    section.html            markup
    section.css / .js       styles / behaviour (optional)
    i18n/en.json fa.json am.json   the text
core/
  build.mjs                 builds dist/          validate.mjs   content check (runs on every PR)
  base.css                  brand colours, fonts, buttons      app.js   tracking + UTM passing
  icons.mjs                 inline icons
assets/                     logo, payout video thumbnails
funnel/telegram-sequence.md BotHelp flow, message scripts (EN/FA/AM), promotion calendar, KPIs
docs/                       language research, site scrape
```

Examples:
- **Change a price** → `packages/challenge/data.json`. Every page, button and FAQ that mentions it updates.
- **Change the Farsi headline** → `sections/hero/i18n/fa.json` → `title1` / `title2`.
- **Swap the Iran payout video** → put the MP4 in `assets/video/` and point `markets/iran/market.json` → `video.file` at it (+ thumbnail). Compress first: `ffmpeg -i in.mp4 -vf scale=-2:720 -c:v libx264 -crf 27 -maxrate 420k -bufsize 840k -c:a aac -b:a 64k -movflags +faststart out.mp4`. Keep each file under 25 MB (Cloudflare Pages limit).
- **Remove a section** → delete its name from `site.config.json` → `sections`.
- **Run a promotion** → `site.config.json` → `promo.enabled: true`, `endsAt`, and the text in `sections/promo-bar/i18n/*.json`.

## Build & check

Node 18+, no dependencies.
```
node core/validate.mjs     # content check
node core/build.mjs        # writes dist/
npx serve dist             # preview at http://localhost:3000/fa/  (add #popup to see the pop-up)
```

## Hosting

Cloudflare Pages or Netlify (free, private repo OK): build command `node core/build.mjs`, output `dist`. Every pull request gets a preview link; merging to `main` goes live.

## Conversion features

- Telegram is the primary action everywhere: header, hero (pulsing), Telegram section, final call to action, closing pop-up (20s / exit intent / 60% scroll on mobile, once per session), floating button (desktop), sticky bar (mobile).
- Every Telegram and register link says which button was clicked (`utm_content`) and carries the visitor's ad source (`utm_source`, `utm_campaign`) into BotHelp and registration.
- Payout video loads only after a click (fast first load). **Iran plays a self-hosted MP4** (`assets/video/iran-payout.mp4`, 720p, ~20 MB) because YouTube is filtered in Iran; Ethiopia uses YouTube until an MP4 is added (`markets/ethiopia/market.json` → `video.file`).
- Accounts limited to $10K–$50K: Challenge $45 / $100 / $175 · Instant 51010 $76 / $196 / $302.
- Events for GA4/GTM and Meta Pixel: `telegram_click` (Pixel `Lead`), `register_click` (Pixel `InitiateCheckout`), `package_tab`, `video_play`, `popup_open`.

## Before launch

- [ ] Native review of Farsi and Amharic text (including the legal footer)
- [ ] BotHelp start codes in `markets/*/market.json` → `telegram.bothelpStart`
- [ ] GTM / Meta Pixel IDs in `site.config.json` → `tracking`
- [ ] Domain in `site.config.json` → `siteUrl` (adds hreflang SEO tags)
- [ ] An Amharic or African trader payout video for Ethiopia (current video features an Uzbek trader)

Team process: [CONTRIBUTING.md](CONTRIBUTING.md).
