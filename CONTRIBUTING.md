# Editing guide (team)

The GitHub repo is the single source of truth. If it isn't merged into `main`, it isn't live.

## Who edits what

| Role | Folders | Approves |
|---|---|---|
| Martin (owner) | everything | all merges, all prices |
| Marketing | `sections/*/i18n/en.json`, `funnel/` | — |
| Farsi reviewer | `*/i18n/fa.json`, `markets/iran/` | Farsi wording |
| Amharic reviewer | `*/i18n/am.json`, `markets/ethiopia/` | Amharic wording |
| Developer | `core/`, `*/section.html`, `*.css`, `*.js` | — |

Nobody merges their own change.

## Editing text in the browser

1. Open the file on github.com (e.g. `sections/hero/i18n/fa.json`) → pencil ✏️.
2. Change only the text inside the quotes. Keep keys, commas, brackets and `{{…}}` exactly as they are.
   - `{{challengeFrom}}` = a number filled in from data. Move it within the sentence if grammar needs it; never delete it and never type the number.
   - `**text**` = bold, `*text*` = yellow highlight.
3. **Commit changes → Create a new branch and start a pull request.**
4. Wait for the **Content check** (green ✓ / red ✗ with the exact line) and the preview link. Check it on your phone.
5. The reviewer merges → live in about a minute.

## Keeping languages in sync

- English is the master. New text goes into `en.json` first, then into `fa.json` and `am.json` under the same key. The check fails if a language is missing a key.
- Prices and percentages live only in `packages/*/data.json` and `site.config.json` → `vars`. Change them once; all languages update.
- Farsi: right-to-left is automatic. Use Western digits (0–9) for prices and numbers.

## Compliance (enforced by the check)

WMT accounts are **simulated**. Use: *funded virtual account, reward share, performance-based rewards, one-time fee, simulated*.
- EN never: profit, profit split, guarantee, real money, our capital, returns.
- FA never: سود (profit), تضمین (guarantee) — use پاداش / سهم پاداش.
- AM never: ትርፍ (profit) — use ሽልማት.

The footer risk text, payment-agent line and restricted-countries line must stay on every page.

## Adding a new market (e.g. Arabic)

1. Copy `markets/iran/` to `markets/<new>/`, set `code`, `path`, `languages`, bot and video.
2. Add `<lang>.json` to every `sections/*/i18n/` and `packages/*/i18n/` folder.
3. Add the market to `site.config.json` → `markets`, and RTL languages to `RTL` in `core/build.mjs`.
4. Run `node core/validate.mjs` until it's green.
