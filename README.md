# Inherit

One workflow. Shared by humans and agents.

Inherit turns a website workflow into an interface that people and AI agents complete together. One definition drives the human UI, WebMCP capabilities, validation, and domain actions. There is no second agent API.

The reusable surface is an SDK (`src/inherit/core`, `react`, `webmcp`). The appointment and brief demos are apps that consume it.

Built for the [OpenAI WebMCP Challenge](https://openai.com) (August 25–September 3, 2026). MIT licensed.

## Why

Most "AI-ready" sites still ship two systems:

```text
human UI
+
separate agent integration
```

That duplicates state, validation, permissions, and business logic. The agent scrapes, guesses, or talks to a sidecar.

Inherit keeps one runtime:

```text
Workflow definition
        ↓
Human UI  ·  WebMCP tools  ·  Validation
        ↓
Shared session
        ↓
Domain actions
```

A person typing a name and an agent calling `submit_step` write the same session. If the agent books while the page is open, the page jumps to confirmation. If the human picks Wednesday, the next `get_form_schema` call already has Wednesday.

## Demo

| URL | What to notice |
| --- | --- |
| [`/`](/) | Package landing. SDK thesis, public API, real demo screenshots. |
| [`/book`](/book) | Top-level ChatGPT URL. Tools register on this document. |
| [`/demo/atelier`](/demo/atelier) | Appointment workflow in a warm editorial host |
| [`/demo/studio`](/demo/studio) | Creative brief. Different steps, same runtime. |
| [`/demo/compare`](/demo/compare) | Two hosts, same component. Tools off so the copies do not fight. |
| [`/demo/atelier?inspect=1`](/demo/atelier?inspect=1) | Inspector. Session, live capabilities, last tool call. |
| [`/lab`](/lab) | Chrome WebMCP lab |

The judged path is `/demo/atelier`. Use `/book` in ChatGPT's in-app browser.

## The core idea

A `WorkflowDefinition` lists steps, fields, actions, and when each action is legal. The runtime projects that into:

- the form UI
- `getAvailableTools(workflow, session)`
- server validation
- SQLite session + activity

Booking is one demonstration of that runtime. The studio brief is the proof it is not booking-specific.

## Human-agent collaboration

There is one `SessionRecord`. No agent session.

1. Human enters name and email.
2. Agent submits preferences with `submit_step`.
3. Agent lists slots, then `propose_slot` for Tuesday.
4. Human clicks Wednesday. Activity rail records both.
5. Agent calls `book_slot` on the selected value. The page confirms.
6. Agent later calls `reschedule_booking`. The confirmation updates in place.

Drafts, tools, and buttons all hit `/api/form/*` or `/api/workflow/action`. Tool calls are not trusted. They run the same validators as the UI.

## Dynamic capabilities

Tools are registered from the current session, then torn down with `AbortSignal` when the set changes.

Before a booking:

```text
get_form_schema
submit_step
get_available_slots
propose_slot
book_slot
```

After confirmation:

```text
get_form_schema
get_available_slots
get_booking_status
reschedule_booking
cancel_booking
```

`book_slot` is gone. `cancel_booking` from an agent creates a proposal the human can confirm.

## Inspector

Open any workflow with `?inspect=1`, or use Developer mode on the form.

It shows session id, workflow, step, version, booking id, the live capability list with add/remove deltas, the last WebMCP execution, and a small architecture diagram. JSON stays here, not in the main flow.

## Architecture

Inherit is the reusable runtime. Booking is one app built with it.

```
src/inherit/core/           defineWorkflow, runtime, capabilities, session
src/inherit/react/          InheritProvider and hooks
src/inherit/webmcp/         WebMCP adapter over the runtime
src/lib/workflows/booking.ts
src/lib/workflows/brief.ts
src/lib/demo/action-handlers.ts
src/lib/booking-service.ts  calendar domain (book, reschedule, cancel)
src/lib/sqlite-store.ts     sessions, bookings, activity
src/lib/inherit-runtime.ts  demo wiring: store + handlers + decorate
src/components/inherit-form.tsx
src/components/activity-rail.tsx
src/components/inherit-inspector.tsx
src/app/api/form/*          schema + step
src/app/api/workflow/action generic action entry
src/app/api/book            book_slot wrapper
```

Human UI and WebMCP both enter through the route handlers, then the workflow runtime, then the domain service, then the store.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No Google OAuth. The default calendar is the file/SQLite provider.

```bash
npm run build
npm start
npm test
```

Copy `.env.example` to override slot capacity, timezone, or `INHERIT_DATA_DIR`. Leave `CALENDAR_PROVIDER=file` for the judged demo.

WebMCP needs a secure context. Feature detection:

```ts
const modelContext = document.modelContext || navigator.modelContext;
```

`document.modelContext` is current. `navigator.modelContext` is the ChatGPT / Chrome 149 fallback.

### ChatGPT desktop

1. Serve the app over HTTPS.
2. Open **`/book`** in the in-app browser, not an iframe.
3. Confirm **Agent tools ready**.
4. Ask it to finish a consult using the shared session.

### Chrome lab

Enable `chrome://flags/#enable-webmcp-testing`, open `/lab` or `/book`, and list tools through Chrome, not the REST API.

## Design tokens

The form is styled with `--inh-*` variables. Pass `atelier`, `northline`, `inherit`, or `host`.

`theme="inherit"` on `<inherit-form>` samples the parent font, color, surface, radius, and button/input chrome. React `preset="host"` does the same. Explicit presets still win when you want a locked look.

```html
<script type="module" src="/inherit-embed.js"></script>
<inherit-form theme="atelier"></inherit-form>
```

## Booking demo details

These are demonstration constraints, not the product:

- 30-minute slots, weekdays 9–5 Pacific, lunch closed
- default capacity 3
- file calendar with seeded occupancy
- Google adapter remains an env-gated stub

Local DB is `./data/inherit.db`. On Vercel it is `/tmp/inherit` unless `INHERIT_DATA_DIR` is set.

## Out of scope

Visual form builder, payments, teams, CRM, extra calendar vendors, email, Google OAuth.

## License

[MIT](./LICENSE)
