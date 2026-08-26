/**
 * Inherit embed: same-origin web component, no iframe.
 * Usage:
 *   <script type="module" src="/inherit-embed.js"></script>
 *   <inherit-form theme="atelier"></inherit-form>
 *
 * Optional: tokens='{"colors":{"primary":"#111"}}'
 * Host CSS variables (--inh-*) inherit into the shadow tree automatically.
 */
const STYLE = `
:host { display: block; }
.inh-form { box-sizing: border-box; width: 100%; color: var(--inh-color-text, #1a1a1a); background: var(--inh-color-surface, #fff); border: 1px solid var(--inh-color-border, #ddd); border-radius: var(--inh-radius-lg, 16px); box-shadow: var(--inh-shadow-md, none); font-family: var(--inh-font-family, inherit); font-size: var(--inh-font-size, 16px); line-height: var(--inh-line-height, 1.5); padding: var(--inh-space-xl, 2rem) var(--inh-space-lg, 1.5rem); }
.inh-form * { box-sizing: border-box; }
.inh-kicker { display: flex; justify-content: space-between; gap: .5rem; color: var(--inh-color-text-muted, #666); font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; }
.inh-title { margin: .5rem 0 0; font-family: var(--inh-font-display, inherit); font-size: 1.7rem; letter-spacing: var(--inh-display-tracking, -0.03em); }
.inh-subtitle { color: var(--inh-color-text-muted, #666); }
.inh-field { display: grid; gap: .35rem; margin: 1rem 0; }
.inh-input, .inh-textarea, .inh-select { width: 100%; padding: .75rem; border: 1px solid var(--inh-color-border, #ddd); border-radius: var(--inh-radius-md, 10px); background: var(--inh-color-surface-muted, #f6f6f6); color: inherit; font: inherit; }
.inh-button { border: 0; cursor: pointer; font: inherit; font-weight: 620; border-radius: var(--inh-radius-md, 10px); padding: .8rem 1.1rem; background: var(--inh-color-primary, #111); color: var(--inh-color-primary-text, #fff); }
.inh-error { color: var(--inh-color-danger, #b00020); }
.inh-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); gap: .4rem; }
.inh-slot { border: 1px solid var(--inh-color-border, #ddd); background: var(--inh-color-surface-muted, #f6f6f6); color: inherit; border-radius: var(--inh-radius-sm, 8px); padding: .6rem; cursor: pointer; font: inherit; }
.inh-slot[data-selected="true"] { background: var(--inh-color-primary, #111); color: var(--inh-color-primary-text, #fff); }
.inh-actions { display: flex; justify-content: space-between; gap: .5rem; margin-top: 1.25rem; }
.inh-status i { display: inline-block; width: .45rem; height: .45rem; border-radius: 99px; background: #999; margin-right: .35rem; }
.inh-status[data-state="ready"] i { background: #22c55e; }
.inh-success { padding: 1rem; border: 1px solid var(--inh-color-border, #ddd); border-radius: var(--inh-radius-md, 10px); }
`;

const TOOLS = [
  ["get_form_schema", "Return the full multi-step Inherit booking form plus current session values.", { type: "object", properties: { sessionId: { type: "string" } } }, true],
  ["get_available_slots", "List 30-minute slots with remaining capacity.", { type: "object", properties: { from: { type: "string" }, to: { type: "string" } } }, true],
  ["submit_step", "Validate and persist one step, then advance.", { type: "object", required: ["stepId", "values"], properties: { sessionId: { type: "string" }, stepId: { type: "string", enum: ["identity", "need", "slot", "confirm"] }, values: { type: "object" } } }, false],
  ["book_slot", "Book a slot, create the calendar event, store the submission.", { type: "object", required: ["slotId"], properties: { sessionId: { type: "string" }, slotId: { type: "string" }, values: { type: "object" } } }, false],
  ["get_booking_status", "Look up bookings by email or booking id.", { type: "object", properties: { email: { type: "string" }, bookingId: { type: "string" } } }, true],
];

function modelContext() {
  return document.modelContext || navigator.modelContext || null;
}

class InheritFormElement extends HTMLElement {
  #sessionId = crypto.randomUUID();
  #state = { currentStepId: "identity", values: {}, booking: null };
  #slots = [];
  #abort = new AbortController();

  static get observedAttributes() {
    return ["theme", "tokens", "session-id"];
  }

  connectedCallback() {
    this.#sessionId = this.getAttribute("session-id") || this.#sessionId;
    const root = this.attachShadow({ mode: "open" });
    const tokens = this.getAttribute("tokens");
    if (tokens) {
      try {
        const parsed = JSON.parse(tokens);
        const map = {
          colors: "color",
          radius: "radius",
          spacing: "space",
          shadows: "shadow",
        };
        for (const [group, cssGroup] of Object.entries(map)) {
          for (const [key, value] of Object.entries(parsed[group] || {})) {
            const kebab = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
            this.style.setProperty(`--inh-${cssGroup}-${kebab}`, value);
          }
        }
        if (parsed.typography?.fontFamily) {
          this.style.setProperty("--inh-font-family", parsed.typography.fontFamily);
        }
      } catch {
        /* ignore invalid tokens JSON */
      }
    }
    this.#boot(root);
  }

  disconnectedCallback() {
    this.#abort.abort();
  }

  async #boot(root) {
    this.#render(root);
    try {
      await this.#load();
      this.#render(root);
      await this.#registerTools();
    } catch (error) {
      const subtitle = root.querySelector(".inh-subtitle");
      if (subtitle) {
        subtitle.textContent = error instanceof Error ? error.message : "Failed to load form";
      }
    }
  }

  async #load() {
    const [schema, slots] = await Promise.all([
      fetch(`/api/form/schema?sessionId=${this.#sessionId}`).then((r) => r.json()),
      fetch("/api/slots").then((r) => r.json()),
    ]);
    this.#apply(schema);
    this.#slots = slots.slots || [];
  }

  #apply(payload) {
    const nested = payload.state || payload;
    if (nested.session) {
      this.#sessionId = nested.session.id;
      this.#state = {
        currentStepId: nested.session.currentStepId,
        values: nested.session.values || {},
        booking: nested.booking || null,
      };
    }
  }

  async #registerTools() {
    const ctx = modelContext();
    const pill = this.shadowRoot?.querySelector("[data-mcp]");
    if (!ctx || typeof ctx.registerTool !== "function") {
      if (pill) {
        pill.dataset.state = "unavailable";
        pill.lastChild.textContent = "WebMCP not available";
      }
      return;
    }
    const getSession = () => this.#sessionId;
    const sync = (data) => {
      this.#apply(typeof data === "string" ? JSON.parse(data) : data);
      this.#render(this.shadowRoot);
      return typeof data === "string" ? data : JSON.stringify(data);
    };
    const exec = {
      get_form_schema: async (args, { signal }) =>
        sync(await (await fetch(`/api/form/schema?sessionId=${args.sessionId || getSession()}`, { signal })).json()),
      get_available_slots: async (args, { signal }) => {
        const q = new URLSearchParams();
        if (args.from) q.set("from", args.from);
        if (args.to) q.set("to", args.to);
        const data = await (await fetch(`/api/slots?${q}`, { signal })).json();
        this.#slots = data.slots || [];
        this.#render(this.shadowRoot);
        return JSON.stringify(data);
      },
      submit_step: async (args, { signal }) =>
        sync(await (await fetch("/api/form/step", { method: "POST", headers: { "content-type": "application/json" }, signal, body: JSON.stringify({ sessionId: args.sessionId || getSession(), stepId: args.stepId, values: args.values || {} }) })).json()),
      book_slot: async (args, { signal }) =>
        sync(await (await fetch("/api/book", { method: "POST", headers: { "content-type": "application/json" }, signal, body: JSON.stringify({ sessionId: args.sessionId || getSession(), slotId: args.slotId, values: args.values || {} }) })).json()),
      get_booking_status: async (args, { signal }) => {
        const q = new URLSearchParams();
        if (args.email) q.set("email", args.email);
        if (args.bookingId) q.set("bookingId", args.bookingId);
        return JSON.stringify(await (await fetch(`/api/booking?${q}`, { signal })).json());
      },
    };
    for (const [name, description, inputSchema, readOnly] of TOOLS) {
      await ctx.registerTool({
        name,
        description,
        inputSchema,
        annotations: { readOnlyHint: readOnly },
        execute: exec[name],
      }, { signal: this.#abort.signal });
    }
    if (pill) {
      pill.dataset.state = "ready";
      pill.lastChild.textContent = "Agent tools ready";
    }
  }

  #fields(defs, values) {
    return defs
      .map(
        ([name, label, type]) =>
          `<label class="inh-field"><span>${label}</span><input class="inh-input" name="${name}" type="${type}" value="${values[name] || ""}"></label>`,
      )
      .join("");
  }

  #render(root) {
    if (!root) return;
    const { currentStepId, values, booking } = this.#state;
    const steps = ["identity", "need", "slot", "confirm"];
    const titles = { identity: "Who you are", need: "What you need", slot: "Pick a time", confirm: "Confirm" };
    let body = "";
    if (booking) {
      body = `<div class="inh-success"><h2 class="inh-title">Booked</h2><p>${booking.name} · ${booking.email}</p><p>${booking.id}</p></div>`;
    } else if (currentStepId === "identity") {
      body = this.#fields([
        ["name", "Full name", "text"],
        ["email", "Email", "email"],
        ["phone", "Phone", "tel"],
      ], values);
    } else if (currentStepId === "need") {
      body = `<label class="inh-field"><span>Session type</span><select class="inh-select" name="service">
        <option value="first_consult" ${values.service === "first_consult" ? "selected" : ""}>First consult</option>
        <option value="follow_up" ${values.service === "follow_up" ? "selected" : ""}>Follow-up</option>
        <option value="focused" ${values.service === "focused" ? "selected" : ""}>Focused working session</option>
      </select></label>
      <label class="inh-field"><span>Format</span><select class="inh-select" name="format">
        <option value="studio" ${values.format === "studio" ? "selected" : ""}>In studio</option>
        <option value="video" ${values.format === "video" ? "selected" : ""}>Video</option>
      </select></label>
      <label class="inh-field"><span>Notes</span><textarea class="inh-textarea" name="notes">${values.notes || ""}</textarea></label>`;
    } else if (currentStepId === "slot") {
      body = `<div class="inh-slot-grid">${this.#slots.map((s) => `<button type="button" class="inh-slot" data-slot="${s.id}" data-selected="${values.slotId === s.id}">${s.label}<br>${s.remaining} left</button>`).join("")}</div>`;
    } else {
      body = `<p>${values.name || ""} · ${values.email || ""}</p><p>${values.slotId || ""}</p><label><input type="checkbox" name="consent" ${values.consent ? "checked" : ""}> Reserve this slot</label>`;
    }
    root.innerHTML = `
      <style>${STYLE}</style>
      <form class="inh-form">
        <div class="inh-kicker"><span>Inherit embed</span><span class="inh-status" data-mcp data-state="registering"><i></i><span>Registering tools</span></span></div>
        <h1 class="inh-title">Book a 30-minute consult</h1>
        <p class="inh-subtitle">${titles[currentStepId] || ""} · step ${steps.indexOf(currentStepId) + 1} of 4</p>
        ${body}
        ${booking ? "" : `<div class="inh-actions"><button type="button" data-back class="inh-button" ${currentStepId === "identity" ? "disabled" : ""}>Back</button><button class="inh-button" data-next>Continue</button></div>`}
      </form>
    `;
    root.querySelector("[data-back]")?.addEventListener("click", () => {
      const i = steps.indexOf(currentStepId);
      if (i > 0) {
        this.#state.currentStepId = steps[i - 1];
        this.#render(root);
      }
    });
    root.querySelectorAll("[data-slot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.#state.values.slotId = btn.getAttribute("data-slot");
        this.#render(root);
      });
    });
    root.querySelector("form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const nextValues = { ...this.#state.values };
      form.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.name) nextValues[el.name] = el.type === "checkbox" ? el.checked : el.value;
      });
      this.#state.values = nextValues;
      if (currentStepId === "confirm") {
        const data = await (await fetch("/api/book", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: this.#sessionId, slotId: nextValues.slotId, values: nextValues }) })).json();
        this.#apply(data);
      } else {
        const data = await (await fetch("/api/form/step", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: this.#sessionId, stepId: currentStepId, values: nextValues }) })).json();
        this.#apply(data);
      }
      this.#render(root);
    });
  }
}

if (!customElements.get("inherit-form")) {
  customElements.define("inherit-form", InheritFormElement);
}

window.dispatchEvent(new CustomEvent("inherit:defined"));
