# Telegram funnel — BotHelp sequence & promotion plan

Bots: **@wmtiran_bot** (Farsi market) · **@wmtethiopia_bot** (Amharic market)
Goal of the bot: capture every landing-page visitor, recommend one package, send them to **register**, then hand hot leads to a sales advisor and keep everyone else warm with promotions.

```
Ad / organic ──► Landing page ──► [Telegram button] ──► BotHelp: welcome + 2 questions ──► package recommendation ──► Register link (UTM)
                        │                                        │                                   │
                        └─► [Register button] ─► my.wemastertrade.com   no answer → reminders      not registered → follow-up D0–D14
                                                                                                    hot lead → sales advisor (handoff)
                                                                                                    everyone → weekly broadcasts & promos
```

---

## 1. BotHelp setup (one time)

1. **Direct link with UTM.** In BotHelp, copy each bot's direct link (`tg://resolve?domain=wmtiran_bot&start=c123…`). Paste the part after `start=` into `markets/<market>/market.json` → `telegram.bothelpStart`, then rebuild.
   The site then sends visitors through `https://r.bothelp.io/tg?domain=…&start=…&utm_source=…&utm_campaign=…&utm_content=<button>&lp_market=…&lp_lang=…` — BotHelp's documented format for passing UTM tags into subscriber fields. Test one link after setup.
   *Until the code is pasted, buttons use plain `t.me/<bot>?start=lp_fa_hero` links (the button name is in the start tag).*
2. **Create custom fields** on the subscriber card (BotHelp only stores fields that already exist): `lp_market`, `lp_lang`, `experience`, `budget`, `recommended`, `registered`.
3. **Tags:** `src_landing`, `lang_fa` / `lang_am` / `lang_en`, `exp_new` / `exp_some` / `exp_pro`, `bud_low` / `bud_mid` / `bud_high`, `rec_ch10` / `rec_ch25` / `rec_in10` / `rec_in25`, `clicked_register`, `registered`, `hot`, `handoff_done`, `promo_optout`.
4. **Button → placement values** sent by the site (`utm_content`): `header`, `hero`, `telegram_section`, `final`, `popup`, `sticky`, `float`, `promo`. Use them to see which part of the page brings leads.
5. **Register link inside the bot** — always add UTM so purchases can be traced to the bot:
   `https://my.wemastertrade.com/register/?utm_source=telegram&utm_medium=bot_<market>&utm_campaign=<recommended>`

---

## 2. Entry flow (first 2 minutes)

| Step | Bot action | Buttons | Tags / fields |
|---|---|---|---|
| E1 | Welcome + language | فارسی · English (Iran) / አማርኛ · English (Ethiopia) | `lang_*` (pre-select from `lp_lang`) |
| E2 | Q1 — experience | New · Some experience · Experienced | `exp_*` |
| E3 | Q2 — budget | Under $100 · $100–$200 · Over $200 | `bud_*` |
| E4 | Recommendation (matrix below) + register button + "Talk to an advisor" | Register · Advisor | `rec_*`, `clicked_register` on click |
| E5 | No answer for 10 min at any step | resend the step once | — |

**Recommendation matrix** (prices = `packages/*/data.json`; update both together)

| | Under $100 | $100–$200 | Over $200 |
|---|---|---|---|
| **New** | Challenge $10K — $45 (`rec_ch10`) | Challenge $25K — $100 (`rec_ch25`) | Challenge $25K — $100 (`rec_ch25`) |
| **Some experience** | Challenge $10K — $45 (`rec_ch10`) | Instant $10K — $76 (`rec_in10`) | Instant $25K — $196 (`rec_in25`) |
| **Experienced** | Instant $10K — $76 (`rec_in10`) | Instant $10K — $76 (`rec_in10`) | Instant $25K — $196 (`rec_in25`) + `hot` |

---

## 3. Follow-up sequence (until tag `registered`)

Stop the sequence the moment `registered` is set (by the sales team or a CRM webhook). Send between 10:00 and 21:00 local time (Iran UTC+3:30, Ethiopia UTC+3).

| When | Purpose | Content | CTA |
|---|---|---|---|
| D0 +1h | Remove friction | "Here's your plan again" + 3-step how-to | Register |
| D1 | Proof | Market payout video (Iran: $10,116.79 interview · Ethiopia: payout video) | Register |
| D3 | Objection | "Not an investment — one fee, simulated account, fee refunded at 6% (Challenge)" | Register · Advisor |
| D5 | Social / community | Short trader story or FAQ answer from the advisor | Advisor |
| D7 | Offer | Current official promotion (only if one is live) — otherwise Instant "first reward after 1 day" angle | Register |
| D14 | Last nudge | "Still thinking? Reply with your question" | Advisor |
| D15+ | Move to broadcast list | weekly content only | — |

**Sales handoff (`hot` → advisor within 15 minutes, working hours):** Experienced + Over $200 · pressed "Advisor" · replied with a question · clicked Register but no `registered` after 24h.

---

## 4. Message scripts

Use `{name}` = subscriber first name, `{plan}` = recommended package text, `{link}` = register link with UTM.

### E1 — Welcome
- **EN:** Hi {name}! Welcome to WeMasterTrade. I'll find the best funded account for you in 2 quick questions. Which language do you prefer?
- **FA:** سلام {name}! به WeMasterTrade خوش آمدید. در 2 سؤال کوتاه بهترین حساب فاند شده را برایتان پیدا می‌کنم. کدام زبان را ترجیح می‌دهید؟
- **AM:** ሰላም {name}! ወደ WeMasterTrade እንኳን በደህና መጡ። በ2 አጭር ጥያቄዎች ለእርስዎ ምርጡን በገንዘብ የተደገፈ ሂሳብ አገኛለሁ። የትኛውን ቋንቋ ይመርጣሉ?

### E2 — Experience
- **EN:** Have you traded a funded (prop firm) account before? · [New] [Some experience] [Experienced]
- **FA:** قبلاً با حساب فاند شده (پراپ فرم) ترید کرده‌اید؟ · [تازه‌کارم] [کمی تجربه دارم] [باتجربه‌ام]
- **AM:** ከዚህ በፊት በገንዘብ በተደገፈ (ፕሮፕ ፈርም) ሂሳብ ተገበያይተው ያውቃሉ? · [አዲስ ነኝ] [ትንሽ ልምድ አለኝ] [ልምድ አለኝ]

### E3 — Budget
- **EN:** How much would you like to spend on your first account? · [Under $100] [$100–$200] [Over $200]
- **FA:** برای اولین حساب چقدر می‌خواهید هزینه کنید؟ · [کمتر از $100] [$100 تا $200] [بیشتر از $200]
- **AM:** ለመጀመሪያ ሂሳብዎ ምን ያህል ማውጣት ይፈልጋሉ? · [ከ$100 በታች] [$100–$200] [ከ$200 በላይ]

### E4 — Recommendation
- **EN:** Your best start: **{plan}**. One-time fee, simulated account, up to 90% reward share and payouts in 24h on average. Register here 👉 {link}
- **FA:** بهترین شروع برای شما: **{plan}**. هزینه یک‌باره، حساب شبیه‌سازی‌شده، تا 90% سهم پاداش و برداشت به‌طور میانگین در 24 ساعت. ثبت‌نام 👉 {link}
- **AM:** ለእርስዎ ምርጡ ጅምር፦ **{plan}**። የአንድ ጊዜ ክፍያ፣ የማስመሰያ ሂሳብ፣ እስከ 90% የሽልማት ድርሻ እና በአማካይ በ24 ሰዓት ክፍያ። ይመዝገቡ 👉 {link}

`{plan}` texts:
| Tag | EN | FA | AM |
|---|---|---|---|
| rec_ch10 | $10K Challenge — $45 | چالش $10K — $45 | የ$10K ቻሌንጅ — $45 |
| rec_ch25 | $25K Challenge — $100 | چالش $25K — $100 | የ$25K ቻሌንጅ — $100 |
| rec_in10 | $10K Instant account — $76 | حساب فاند فوری $10K — $76 | የ$10K ፈጣን ሂሳብ — $76 |
| rec_in25 | $25K Instant account — $196 | حساب فاند فوری $25K — $196 | የ$25K ፈጣን ሂሳብ — $196 |

### D0 +1h — How to start
- **EN:** 3 steps to start: 1) Register 2) Choose {plan} 3) Pay once and start trading today. Need help? Press "Advisor".
- **FA:** شروع در 3 قدم: 1) ثبت‌نام 2) انتخاب {plan} 3) یک‌بار پرداخت و شروع ترید از همین امروز. کمک می‌خواهید؟ «مشاور» را بزنید.
- **AM:** በ3 ደረጃዎች ይጀምሩ፦ 1) ይመዝገቡ 2) {plan} ይምረጡ 3) አንድ ጊዜ ይክፈሉ እና ዛሬውኑ መገበያየት ይጀምሩ። እገዛ ይፈልጋሉ? «አማካሪ»ን ይጫኑ።

### D1 — Payout proof
- **EN:** Real trader, real payout 🎥 Watch how he did it: {video}
- **FA:** تریدر واقعی، برداشت واقعی 🎥 ببینید چطور موفق شد: {video}
- **AM:** እውነተኛ ነጋዴ፣ እውነተኛ ክፍያ 🎥 እንዴት እንደተሳካለት ይመልከቱ፦ {video}

### D3 — Objection
- **EN:** Quick reminder: this is not an investment. You pay one fee, trade a simulated account and, on the Challenge, get your fee back once you reach 6%. Questions? Tap "Advisor".
- **FA:** یادآوری کوتاه: این سرمایه‌گذاری نیست. یک‌بار هزینه می‌پردازید، با حساب شبیه‌سازی‌شده ترید می‌کنید و در چالش، با رسیدن به 6% هزینه‌تان برمی‌گردد. سؤالی دارید؟ «مشاور» را بزنید.
- **AM:** አጭር ማስታወሻ፦ ይህ ኢንቨስትመንት አይደለም። አንድ ጊዜ ይከፍላሉ፣ በማስመሰያ ሂሳብ ይገበያያሉ፣ በቻሌንጅ ደግሞ 6% ሲደርሱ ክፍያዎ ይመለሳል። ጥያቄ አለዎት? «አማካሪ»ን ይጫኑ።

### D7 — Offer (only with a live official promotion)
- **EN:** 🎁 Bot members first: {promo_text} — until {promo_end}. Use it here 👉 {link}
- **FA:** 🎁 اول برای اعضای ربات: {promo_text} — تا {promo_end}. استفاده کنید 👉 {link}
- **AM:** 🎁 መጀመሪያ ለቦቱ አባላት፦ {promo_text} — እስከ {promo_end}። እዚህ ይጠቀሙ 👉 {link}

### D14 — Last nudge
- **EN:** Still thinking about it, {name}? Reply with any question — a local advisor answers in your language.
- **FA:** {name}، هنوز در حال فکر کردن هستید؟ هر سؤالی دارید بپرسید — مشاور فارسی‌زبان پاسخ می‌دهد.
- **AM:** {name}፣ አሁንም እያሰቡ ነው? ማንኛውንም ጥያቄ ይጠይቁ — የአካባቢ አማካሪ በአማርኛ ይመልሳል።

> Farsi and Amharic scripts are drafts. Have a native speaker review them before they go live.

---

## 5. Broadcasts & promotions (everyone not opted out)

| Day | Content type | Example |
|---|---|---|
| Monday | Education | One rule explained simply (daily loss limit, consistency rule) |
| Wednesday | Proof | Payout video / interview (YouTube @WeMasterTrade_Iran for Farsi) |
| Friday | Offer or community | Live official promotion · or Q&A with the advisor |

Rules:
- **Max 3 broadcasts a week** per subscriber; segment by `lang_*` and stage (`registered` vs not).
- **Promotions only from the official promotions page**, always with the real end date. Never invent a discount or urgency.
- When a promotion is live, turn on the site's promo bar too (`site.config.json` → `promo`) so the page and the bot say the same thing.
- Add `promo_optout` for anyone who asks to stop offers; keep sending them education only.
- Compliance words: *reward share, performance-based rewards, funded virtual account, simulated, one-time fee*. Never: profit / سود / ትርፍ, guaranteed, investment, real money.

---

## 6. What to measure (weekly)

| Stage | Metric | Where |
|---|---|---|
| Page → bot | Telegram clicks ÷ visitors, by `utm_content` button | GA4 / GTM event `telegram_click` |
| Bot start | Starts ÷ Telegram clicks | BotHelp |
| Quiz | Finished Q2 ÷ starts | BotHelp tags `bud_*` |
| Register | `clicked_register` ÷ quiz finished | BotHelp |
| Purchase | Paid accounts with `utm_source=telegram` | CRM / WMT back office |
| Handoff | `hot` leads answered within 15 min | Sales team |

Set targets after the first two weeks of real data, then test one change at a time (headline, button text, pop-up timing, recommendation wording).
