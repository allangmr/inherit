# Inherit

A lightweight, embeddable multi-step form + booking system that **inherits a host site’s design tokens** and is **fully agent-native via WebMCP**.

This is not another Fillout. Inherit is the first form+booking surface designed so humans and AI agents use the same interface: pixel-perfect visual integration, and structured tools registered on the live page.

Built for the [OpenAI WebMCP Challenge](https://openai.com) (August 25–September 3, 2026). MIT licensed.

## Why this exists

Most “AI-ready” forms are a human UI plus a bolted-on API. The agent scrapes, guesses, or talks to a second system. Inherit keeps one state machine:

- A person filling a step and an agent calling `submit_step` write the same session.
- `book_slot` creates the calendar event the picker already showed as free.
- `get_form_schema` returns the schema **and** the values currently on screen.

If an agent books while the page is open, the page jumps to the confirmation. If a human types a name, the next `get_form_schema` call sees it.

## Demo URLs

| URL | What judges should notice |
| --- | --- |
| [`/`](/) | Inherit-branded landing + live form |
| [`/book`](/book) | Clean top-level form. **Use this URL in ChatGPT’s in-app browser.** Tools register on this document. |
| [`/demo/atelier`](/demo/atelier) | Warm editorial host (serif, cream, terracotta) |
| [`/demo/northline`](/demo/northline) | Sharp SaaS host (hairline radius, IBM Plex, electric blue) |
| [`/demo/compare`](/demo/compare) | Both hosts side by side: host buttons/inputs vs the Inherit form |
| [`/lab`](/lab) | Chrome WebMCP lab — list and execute tools through the browser API |
| [`/demo/embed`](/demo/embed) | `<inherit-form>` web component, no iframe |

The Atelier and Northline pages render the **same form component**. Only the token preset changes.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No Google OAuth. The default calendar is a deterministic file/SQLite provider.

```bash
npm run build
npm start
npm test
```

Copy `.env.example` if you want to override slot capacity, timezone, or data directory. Leave `CALENDAR_PROVIDER=file` for the judged demo.

## How to test WebMCP

Feature detection used in this repo:

```ts
const modelContext = document.modelContext || navigator.modelContext;
```

`document.modelContext` is current (Chrome docs, updated August 20, 2026). `navigator.modelContext` is deprecated in Chrome 150 and kept as a fallback for ChatGPT’s in-app browser and Chrome 149 with the WebMCP testing flag.

### ChatGPT desktop (in-app browser)

1. Deploy or tunnel the app over HTTPS (WebMCP requires a secure context).
2. Open **`/book`** in ChatGPT’s in-app browser — not a cross-origin iframe.
3. Confirm the pill reads **Agent tools ready**.
4. Ask ChatGPT to book a 30-minute first consult for you. It should call `get_form_schema` → `get_available_slots` → `book_slot` (or `submit_step` along the way).

### Chrome 146+ with the testing flag (this repo’s /lab)

Chrome 148 in this environment is enough. The producer API is `navigator.modelContext` until Chrome 150.

1. Enable `chrome://flags/#enable-webmcp-testing` (or launch with `--enable-features=WebMCP,WebMCPTesting`).
2. Relaunch Chrome.
3. Open **`/lab`** (or `/book`). The form registers the five tools on this document.
4. In the **Chrome WebMCP lab** panel, click **List tools via Chrome**. That calls `getTools()` / `modelContextTesting.listTools()` — not our REST API.
5. Run `get_form_schema`, then `submit_step (identity)`. The form on the left must show the name the tool wrote.

If the probe shows `registerTool: false`, the flag is off. The lab will refuse to pretend.

Tools unregister with `AbortSignal` when the form unmounts. There is no `unregisterTool` / `provideContext` / `clearContext` in this implementation.

### Cross-origin iframe note

This demo prefers a same-origin component / `<inherit-form>` script tag. If you embed via iframe anyway:

```html
<iframe src="https://your-host/embed?theme=atelier" allow="tools"></iframe>
```

The iframe must also pass `exposedTo: ['https://parent-origin']` on `registerTool`. For the ChatGPT in-app demo, skip the iframe and load `/book` at the top level.

## Agent vs human judging script

Takes about three minutes.

1. **Inheritance.** Open `/demo/atelier` and `/demo/northline` side by side. Same steps, same copy, different paper / radius / type. Then open `/book` for the Inherit brand.
2. **Human path.** On `/book`, complete Who you are → What you need → Pick a slot → Confirm. You get a booking id. Slots show remaining capacity (`N of 3 left`).
3. **Shared state.** In a WebMCP-capable browser, start the form as a human (enter a name). Ask the agent for `get_form_schema`. The name must already be there.
4. **Agent path.** Ask the agent to finish the booking with `get_available_slots` and `book_slot`. The page should flip to the confirmation without a refresh hack.
5. **Lookup.** Call `get_booking_status` with the email or booking id. It matches what the UI shows.
6. **No OAuth.** Do all of the above with `CALENDAR_PROVIDER=file`. The Google adapter is an env-gated stub (`src/lib/google-calendar.ts`) so a real Calendar API can drop in behind `CalendarProvider` later.

## WebMCP tools

Registered one-at-a-time with `registerTool({ name, description, inputSchema, execute, annotations }, { signal })`. `execute` receives `(args, { signal })` and forwards `signal` to `fetch`.

| Tool | Writes? | Input | Result |
| --- | --- | --- | --- |
| `get_form_schema` | read | `sessionId?` | Steps, fields, validation rules, current values, booking if any |
| `get_available_slots` | read | `from?` `to?` | 30-min slots with `remaining` > 0 |
| `submit_step` | write | `stepId`, `values`, `sessionId?` | Validates, persists, advances; UI updates |
| `book_slot` | write | `slotId`, `values?`, `sessionId?` | Calendar event + stored submission + confirmation state |
| `get_booking_status` | read | `email?` or `bookingId?` | Matching bookings |

Human UI and tools share the Next.js route handlers under `/api/*` and a session in SQLite.

## Design tokens

The form is styled only with `--inh-*` CSS variables (color, radius, type, spacing, shadow). A host can:

1. Pass a preset: `inherit` · `atelier` · `northline`
2. Pass a tokens object (`colors`, `radius`, `typography`, `spacing`, `shadows`)
3. Set the CSS variables on a parent — they inherit, including into the web component’s shadow tree

```html
<script type="module" src="https://your-host/inherit-embed.js"></script>
<inherit-form
  theme="atelier"
  tokens='{"colors":{"primary":"#b8431f"},"radius":{"md":"4px"}}'
></inherit-form>
```

Same-origin React hosts use `<InheritForm preset="northline" />`.

## Booking + storage

- **Slots:** 30 minutes, weekdays 9–5 Pacific, lunch hour closed, default capacity **3**.
- **CalendarProvider:** `listSlots`, `getSlot`, `createEvent`, `getEvent`.
- **File provider:** deterministic working hours + seeded occupancy + SQLite-backed events. Demo works with zero OAuth.
- **Google provider:** env-based stub. Set `CALENDAR_PROVIDER=google` plus `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` when you wire `events.insert` / `freebusy`.
- **Store:** `InheritStore` interface, SQLite (`better-sqlite3`) implementation. Swap the store without touching the form.

Local DB lives in `./data/inherit.db` (gitignored). On Vercel it uses `/tmp/inherit`.

## Project shape

```
src/app/book                 top-level form (ChatGPT URL)
src/app/demo/atelier         warm host
src/app/demo/northline       sharp host
src/app/api                  schema, step, slots, book, booking
src/lib/calendar.ts          CalendarProvider
src/lib/file-calendar.ts     deterministic demo calendar
src/lib/google-calendar.ts   env stub
src/lib/sqlite-store.ts      swappable persistence
src/lib/inherit-tools.ts     WebMCP tool definitions
public/inherit-embed.js      <inherit-form> script
```

## Out of scope

Visual form builder, payments, teams, CRM, extra calendar vendors, and email confirmation.

## License

[MIT](./LICENSE)
