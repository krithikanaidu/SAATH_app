# SAATH · साथ — Mumbai Commuter PWA

A click-through, installable Progressive Web App built **from the Figma file `Px1mKHhktxOTDt3Ts4o2L4`**. Every screen, button, tab, form and modal in the prototype is wired into a working journey — onboarding → sign-in → setup → daily commute → safety → rewards — and runs offline as an installable app.

> **Scope note:** this is a *design-faithful prototype* with a real **Supabase backend** for auth, profiles, groups, crowd reports and trips. When the backend is unconfigured or unreachable the app degrades to a local session and keeps working (see [Backend](#backend--supabase)). No secrets exist in this codebase — only a publishable (anon) key, which is safe for the browser and gated by Row Level Security.

---

## Table of contents

1. [Tech stack & quick start](#tech-stack)
2. [Backend & Supabase](#backend--supabase)
3. [How the design was reproduced](#how-the-design-was-reproduced)
4. [Screen & route inventory](#screen--route-inventory)
5. [User flows](#user-flows)
6. [Testing](#testing)
7. [PWA](#pwa)
8. [Deploying to Vercel](#deploying-to-vercel)
9. [Data & what still needs a backend](#data--what-still-needs-a-backend)
10. [Project structure](#project-structure)
11. [Known notes about the source design](#known-notes-about-the-source-design)

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build | **Vite 7** | instant dev server, tiny production bundle |
| UI | **React 19** + **TypeScript** | type-safe across ~31 screens |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | design tokens live in `@theme` in `src/index.css` — no config file |
| Routing | **React Router 7** (`BrowserRouter`) | real URLs, deep-linkable state screens |
| State | React Context + `localStorage` | offline-first cache, survives refresh |
| Backend | **Supabase** (`@supabase/supabase-js`) | phone-OTP auth, Postgres, Row Level Security |
| Service worker | hand-written `public/sw.js` | explicit control over what is **never** cached |
| Fonts | self-hosted `.woff2` in `public/fonts/` | correct typography offline (no CDN dependency) |

No UI kit, no CSS-in-JS, no state library. The dependency surface is React + Router + Supabase.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build -> dist/
npm run preview    # serve dist/ at http://localhost:4173
npm run typecheck  # tsc --noEmit only
```

The production build splits Supabase and React into their own cached vendor chunks (`supabase-*.js`, `react-*.js`), so the app's own code stays ~118 kB and the heavy vendor code is only downloaded once.

---

## Backend & Supabase

The app ships with a real backend: **Supabase** handles phone-OTP auth, profiles, buddy groups, crowd reports and trips. It is designed to degrade gracefully — if the project is unconfigured or unreachable, the app falls back to a local session and keeps working, so the prototype never dead-ends.

### 1. Configure the environment

`.env.local` (git-ignored) holds the project URL and **publishable** key:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx   # safe for the browser, gated by RLS
VITE_OTP_LENGTH=6                                  # optional — must match the dashboard setting
```

> **Note on your current credentials:** the project ref `yitrfbddwxkyaoybptdw` does not resolve in DNS (`getaddrinfo ENOTFOUND`), so the backend is currently unreachable and the app runs in demo mode. Verify the ref in your Supabase dashboard → *Settings → API* and update `.env.local`. Nothing else needs to change — the same code switches to live mode automatically once the host resolves.

Only a publishable (anon) key ships to the browser. There is no service-role key, no secret, and every table is protected by Row Level Security, so the key alone cannot read or write another user's data.

### 2. Create the schema

Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) once in the Supabase SQL editor (or `supabase db push`). It creates:

| Table | Purpose |
| --- | --- |
| `profiles` | one row per user — name, language, route, departure, points, toggles |
| `buddy_groups` | user-created groups (name, line, from/to, window, organiser) |
| `group_members` | membership, with `organiser` / `member` roles |
| `crowd_reports` | anonymous crowd reports per train + compartment |
| `trips` | completed journeys and the points they earned |

The migration also installs a trigger that auto-creates a `profiles` row whenever a new auth user appears, and enables RLS with owner-scoped policies on every table.

### 3. Turn on phone auth

Dashboard → *Authentication → Providers → Phone* and enable it. You also need an SMS provider (Twilio, Vonage, or Twilio Verify). Set the **OTP length** to match `VITE_OTP_LENGTH` (Supabase's default is 6; the Figma design shows 4 — either works as long as the two agree).

### How the app behaves in each mode

| Situation | What happens |
| --- | --- |
| Backend configured **and** reachable | real phone OTP, sessions, and data written to Postgres |
| Backend configured but **unreachable** | `pingBackend()` fails → the flow continues on a local session; a `Saved on this device` badge appears instead of `Live · synced` |
| Backend **not configured** | same local fallback, from the first screen |

Every data call goes through [`src/lib/db.ts`](src/lib/db.ts), which tries Supabase first (bounded by a timeout) and falls back to the local store. Screens never talk to `supabase` directly, and each result carries a `source: 'remote' | 'local'` flag surfaced by the `SyncBadge` component.

---

## How the design was reproduced

The Figma file contains **two visual systems**, and both are reproduced as designed:

| System | Typeface | Background | Accent | Used by |
| --- | --- | --- | --- | --- |
| **Mono** | Inter | `#FFFFFF` | `#202020`, crowd blues `#234D7D` / `#A8C5EB` / `#E8F0FA` | the primary app screens (S05, S06, S07, S08a, S09, S10, S11a, S12) |
| **Amber** | Bebas Neue | cream `#FAF8F4` (S11b: danger-soft `#FFE9E6`) | `#F9B800`, ink `#111111`, hard offset shadows | the **entire first-run journey (S01 → S04)**, every b/c step, and **every state screen** (loading / empty / offline / error / confirmed) |

Two deliberate adjustments were made to the Figma exports, at the owner's request:

- **The phone status bar is not rendered.** Every Figma screen contains a "9:41 · LTE · Wi-Fi · 100%" bar; it is a Figma reference element, not product UI, so it is intentionally absent from the app. In installed mode the OS status bar is respected via `env(safe-area-inset-top)`.
- **The first-run journey is unified on the amber system.** In the file, S01 / S02a / S03a / S04a are mono while S02b/c, S03b/c and S04b are amber. To keep the sign-up flow visually consistent, all of S01–S04 now render in the amber system. The mono system remains on the signed-in app screens, exactly as designed.

Tokens, radii, colour values, font sizes and weights were extracted from the Figma API and are declared once in `src/index.css`:

```css
@theme {
  --color-ink: #202020;
  --color-muted: #616161;
  --color-line: #dddddd;
  --color-crowd-high: #234d7d; /* … */
  --font-sans: "Inter", …;
  --font-display: "Bebas Neue", …;
}
```

Fonts are **self-hosted** (Inter variable, Bebas Neue, and Noto Sans Devanagari for the हिन्दी/मराठी screens), split by `unicode-range` so Devanagari only loads when needed. All four files are precached by the service worker, so the app keeps its exact typography offline.

Layout is **mobile-first**: below 480 px the 390 × 844 Figma canvas is full-bleed; at ≥480 px it becomes a centred phone canvas with the design's shadow, so desktop viewing stays faithful.

Reference renders of every Figma screen live in [`design/screens/`](design/screens/) and were used as ground truth while building.
---

## Screen & route inventory

All 31 screens from the prototype are implemented. State screens are **deep-linkable** with `?state=…`, which also makes them easy to review and to screenshot.

| Route | Screen(s) | State variants (`?state=`) |
| --- | --- | --- |
| `/` | S01 Splash + language picker (amber) | — |
| `/onboarding` | S02a · S02b · S02c (amber carousel) | — |
| `/signup` | S03a phone entry (amber) → S03b verify SMS code (amber) → S03c location (amber) | `error` → **S03a_Error** (amber, inline validation) |
| `/setup` | S04a usual journey (amber) → S04b about you (amber) | `error` → **S04a_Error** (amber, same-station validation) |
| `/home` | S05 Home (mono) | `loading` **S05a** · `empty` **S05b** · `offline` **S05c** · `location-off` **S05_Location_Off** |
| `/train/:trainId` | S06 train detail + coach crowd (mono) | `loading` **S06a** · `offline` **S06b** |
| `/smart-window` | S07 compare departures (mono) | — |
| `/queue` | S08a choose slot (mono) → S08b confirmed (amber) | `offline` **S08c** |
| `/groups` | S09 Saath Groups (mono) | `empty` **S09a** |
| `/groups/:groupId` | S10 group detail + chat (mono) | — |
| `/sos` | S11a hold-to-send (mono) → S11b countdown (amber) → S11c sent (amber) | — |
| `/profile` | S12 trip + rewards (mono) | `empty` **S12a** |
| `/404` | not-found | — |

Examples:

```
http://localhost:5173/home?state=offline
http://localhost:5173/signup?state=error
http://localhost:5173/groups?state=empty
```

**States also trigger naturally**, not only by URL:

- `loading` — Home shows its skeleton once per browser session, exactly like a first data fetch.
- `offline` — Home, train detail and the queue listen to real `online`/`offline` events (DevTools → Network → Offline to see it).
- `error` — sign-up and journey setup validate as you type; the amber error screens appear when the input is actually invalid, and fixing the input enables the CTA.

---

## User flows

The bottom navigation maps exactly as documented on the prototype's Flows page:
**Home → `/home` · Plan → `/smart-window` · Groups → `/groups` · Safety → `/sos` · ME → `/profile`**
(the mono screens label these Home / Trains / Groups / Safety / Profile; the amber screens use HOME / PLAN / GROUPS / SAFETY / ME).

Fully wired journeys:

1. **First launch** — pick language → onboarding carousel → enter mobile number → SMS code → location permission → usual journey → about you → Home. With Supabase reachable this is a real phone-OTP sign-in; otherwise it continues on a local session.
2. **Daily commute** — Home → Smart Window (compare 08:18 / 08:30 / 08:42) → train detail → report crowd (persisted to `crowd_reports`) → boarding slot → zone confirmation.
3. **Groups** — list → group detail → join/leave → chat. There are **no hardcoded group names**: every group is a real row you create with the "+" (on `/groups` or the amber `S09a`), and the organiser can **delete** a group from the detail page or the list. Deleting a nonexistent group renders a "Group not found" state rather than a 404.
4. **Safety** — hold the SOS pad for 2 s → 5 s cancellable countdown → contacts notified, live elapsed timer, location sharing.
5. **Rewards & profile** — trip summary, points and recent trips (from `trips`), plus a profile card showing your name, number, route and usual departure. **Edit profile** updates name/line/stations for the whole app; the settings sheet offers language, large text, **reset** and **sign out**.

State set during setup drives the rest of the app: the **name** greets you on Home, and the **line / stations / departure** you pick appear on Home, Smart Window, Virtual Queue and Rewards. The departure you choose on Smart Window is the one the queue and trip summary use.

### Stations & departure time

All three lines carry their full station lists, ordered south → north:

- **Western** (23) — Churchgate … Dahanu Road
- **Central** (24) — CSMT … Kasara
- **Harbour** (32) — CSMT … Panvel

Departure time is **flexible** rather than a fixed list. On `/setup` you get four quick presets (Early / Rush / Mid / Eve), a native time picker for *any* time, and a frequency selector (Weekdays / Weekends / Every day) that matches how often you actually make the journey. Everything is stored as `HH:MM` plus the frequency, and the UI formats it for display.

---

## Testing

### Manual walk-through

```bash
npm run dev
```

Open `http://localhost:5173`, then:

1. Complete onboarding (any 10-digit number unlocks **SEND CODE**; any 6-digit code is accepted — see [`VITE_OTP_LENGTH`](#backend--supabase)).
2. Tap through Home → Smart Window → train → queue → confirm; Groups → join; Safety → hold SOS → cancel; ME → settings.
3. Flip DevTools → Network → **Offline** and revisit `/home`, `/train/t-0830`, `/queue` — the amber offline screens appear automatically.
4. Check each state screen listed in [the inventory](#screen--route-inventory).
5. Reload on a deep link (e.g. `/train/t-0842`) — it renders directly, no 404. A deleted or unknown group (`/groups/<id>`) shows a "Group not found" state with a way back, not a 404.
6. Chrome → ⋮ → *Install SAATH* (or the address-bar icon) to install the PWA, then relaunch it from the desktop/taskbar icon and re-check the offline screens.

### Automated suites

Three headless-Chrome suites live in [`tests/`](tests/) and talk to Chrome DevTools Protocol (no extra npm dependency — they use Node's built-in `WebSocket`).

Start Chrome with remote debugging first:

```powershell
# Windows
start chrome --remote-debugging-port=9333 --user-data-dir=%TEMP%\saath-cdp
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9333 --user-data-dir=$TMPDIR/saath-cdp
```

Then, in three terminals (or sequentially):

```bash
npm run dev            # terminal 1 — flow test needs :5173
npm run build && npm run preview   # terminal 2 — PWA + responsive suites need :4173

npm run test:flow         # 44 checks — every journey, state screen and interaction
npm run test:pwa          # 36 checks — manifest, icons, service worker, offline fallback
npm run test:responsive   # 30 checks — 360 / 414 / 768 / 1280 / 1920 px, 6 routes each
```

Two extra helper scripts are also in `tests/`: `shots.mjs` (screenshots the first-run journey) and `verify-name-flow.mjs` (walks the full sign-up with a custom name/route and asserts it reaches Home). Both take the base URL as an optional first argument.

The flow suite writes a screenshot per step to `tests/out/` (git-ignored) and prints `CONSOLE ERRORS: none` on a clean run. Current status: **44/44, 36/36, 30/30 passing with a clean console.**

---

## PWA

- **Manifest** — `public/manifest.webmanifest`: `name` "Saath — Travel with less crowd, more company", `short_name` "Saath", `display: standalone`, `theme_color` `#FAF8F4`, `background_color` `#FAF8F4`, portrait orientation, app `shortcuts` to `/sos` and `/home`, and `icons` including a `maskable` entry.
- **Icons** — `public/icons/`: 192, 512, maskable-512 and 180 px `apple-touch-icon`, all rendering the app's "S" mark.
- **Service worker** — `public/sw.js`, hand-written so the caching policy is explicit:
  - navigations: **network-first** with offline fallback to the cached app shell;
  - hashed `/assets/*`: cache-first (immutable);
  - precache: app shell, manifest, icons and all four fonts, under versioned caches (`saath-v1-shell`, `saath-v1-assets`);
  - **never** caches cross-origin requests or anything under `/api/` — so no sensitive or API data can be stored by the SW;
  - a new version activates cleanly (old caches are deleted on `activate`).
- **Install & safe areas** — `apple-mobile-web-app-capable`, `mobile-web-app-capable` and status-bar meta tags in `index.html`. The viewport uses `viewport-fit=cover`, `.device` pads with `env(safe-area-inset-top)` and both tab bars use `.nav-safe` (`env(safe-area-inset-bottom)`), so the bottom navigation stays clear of the OS home indicator when installed. The tab bars are also `position: sticky` inside the scroll column, so long content scrolls underneath instead of pushing them off-screen.
- **Offline behaviour** — with the network cut, the shell loads, fonts render from cache, and the app shows its amber offline screens.

---

## Deploying to Vercel

The build output is `dist/`, and `vercel.json` already contains the single SPA rewrite that client-side routing needs:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### From GitHub (recommended)

1. Push the project to a GitHub repository (`git init`, `git add .`, `git commit -m "SAATH PWA"`, then push). Remember that `.env.local` is git-ignored — the Supabase values are **not** committed.
2. On [vercel.com/new](https://vercel.com/new), import the repository.
3. Vercel auto-detects **Vite** — confirm: Framework **Vite**, Build Command `npm run build`, Output Directory `dist`.
4. Add the environment variables under *Settings → Environment Variables* (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable (anon) key |
   | `VITE_OTP_LENGTH` | `6` (or `4`, matching the dashboard OTP length) |

   These are baked in at build time, so redeploy after changing them.
5. Deploy. Deep links such as `/home?state=offline` work immediately thanks to the rewrite.

> The app still deploys and runs correctly **without** these variables — it simply operates in local/demo mode, since the Supabase client is optional by design.

### With the CLI

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production
```

After the first deploy, set **Deployment Protection → Disabled** if you want the link to be publicly shareable.

---

## Data & what still needs a backend

Persistence is split so the local fallback and the real backend are interchangeable:

- [`src/lib/supabase.ts`](src/lib/supabase.ts) — client creation from env, plus a network reachability probe.
- [`src/lib/db.ts`](src/lib/db.ts) — **the only module that talks to Supabase.** Every call tries the backend (bounded by a timeout) and falls back to local state, returning `source: 'remote' | 'local'`.
- [`src/lib/auth.tsx`](src/lib/auth.tsx) — phone-OTP session, profile sync, sign-out, and the demo-mode fallback.
- [`src/lib/hooks.ts`](src/lib/hooks.ts) — `useGroups` / `useTrips` / `useCrowdReports` used by the screens.
- [`src/lib/store.tsx`](src/lib/store.tsx) — the Context + `localStorage` key **`saath.state.v1`**, used as the offline cache and the fallback backend. The Settings sheet can reset it.
- [`src/lib/mockData.ts`](src/lib/mockData.ts) — trains, contacts, slots and the station lists. Group/member/chat data is **no longer mocked** — it comes from the database.

| Feature | Status | Still needs |
| --- | --- | --- |
| OTP sign-in | **real** — Supabase phone OTP, with local fallback when unreachable | SMS provider (Twilio/Vonage) + `otp_length` matched to `VITE_OTP_LENGTH` |
| Profiles | **real** — `profiles` table, auto-created by a DB trigger; editable in-app | — |
| Groups | **real** — create / join / leave / delete against `buddy_groups` + `group_members` | moderation + reporting tools |
| Group chat | local per-session only | `messages` table + Supabase Realtime channel |
| Crowd reports | **real** — written to `crowd_reports` | aggregation (recency-weighted average), abuse controls |
| Trips & points | **real** — written to `trips` | points rules engine, reward redemption |
| Live train data | static illustrative trains, "Not live" disclaimers | railway feed / GTFS-RT, scheduled refresh |
| Boarding slots | advisory mock slots | availability service, booking rules |
| SOS delivery | simulated countdown + timer | SMS/push delivery to contacts, live location streaming |
| Trusted contacts | 3 mock contacts | contact CRUD + verification |

**Security:** there are no secrets in this repository. The only key shipped to the browser is a publishable (anon) key, which is designed for client use and is gated by Row Level Security on every table. No service-role key exists in the frontend. The service worker deliberately never caches `/api/` or cross-origin responses, so Supabase responses are never written to the cache.

---

## Project structure

```
public/
  icons/            192, 512, maskable-512, apple-touch-icon
  fonts/            Inter (variable), Bebas Neue, Noto Sans Devanagari
  manifest.webmanifest
  sw.js             service worker (explicit caching policy)
src/
  components/       DeviceFrame, ScreenHeader, BottomNav, Button, SyncBadge,
                    CrowdBadge, forms (incl. OtpInput), icons, amber.tsx
  lib/              types.ts, mockData.ts, store.tsx (localStorage cache),
                    supabase.ts (client + reachability), db.ts (data access,
                    the only module touching Supabase), auth.tsx (phone OTP +
                    demo fallback), hooks.ts (useGroups/useTrips/useCrowdReports),
                    useOnline.ts
  screens/          S01…S12 (+ NotFound) — one file per design screen
  App.tsx           routes + onboarding gate
  index.css         design tokens (@theme), @font-face, device frame
supabase/
  migrations/       0001_init.sql — schema, RLS policies, profile trigger
tests/              flow / pwa / responsive CDP suites (+ out/ screenshots)
design/screens/     Figma reference renders used as ground truth
vercel.json         SPA rewrite
```

---

## Known notes about the source design

These are deliberate, design-faithful decisions worth knowing when comparing against Figma:

- **Mono/amber split across the app.** The signed-in app screens are mono/Inter; the first-run journey, the b/c steps and *all* loading/empty/offline/error screens are amber/Bebas. That split is in the Figma file and is reproduced rather than normalised.
- **Route copy is now shared, not screen-specific.** In the source file the mono Home shows *Borivali → Churchgate, 08:30* while the amber state screens show *Andheri → Churchgate, usual 08:40*. Rather than keeping two contradictory routes, every screen reads the route, name and departure from the store, so the journey stays consistent end-to-end.
- **S03a is single-treatment amber.** The file holds a mono phone-entry screen (6-digit OTP) *and* an amber one ("we will send a 4-digit code"). The amber treatment is used for both the default and `?state=error`, and the code is entered once, on the verify step — so the user is never asked to verify twice. The number of boxes is driven by `OTP_LENGTH` (`VITE_OTP_LENGTH`, default 6 to match Supabase); set it to 4 in both the env file and the Supabase dashboard to match the amber design exactly.
- **The 9:41 status bar is not rendered.** It is a Figma reference element, not product UI.
- **SOS countdown is 5 s**, matching the screen copy (the flows board says 3 s; screen copy wins).
- **Illustrative data only** — "Illustrative · Not live" disclaimers appear exactly where the design places them.
