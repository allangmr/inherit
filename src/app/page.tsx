import Link from "next/link";
import { InheritForm } from "@/components/inherit-form";
import { SiteNav } from "@/components/site-nav";

const tools = [
  ["get_form_schema", "Full multi-step structure, validation, and current values"],
  ["get_available_slots", "Free 30-min slots with capacity already applied"],
  ["submit_step", "Validate a step and advance — same path as the UI"],
  ["book_slot", "Create the calendar event and store the submission"],
  ["get_booking_status", "Look up by email or booking id"],
];

export default function HomePage() {
  return (
    <div className="inherit-hero inherit-grid site-shell text-[#f4f1ea]">
      <SiteNav />
      <main className="mx-auto grid w-full max-w-6xl gap-16 px-6 pb-24 pt-10 md:grid-cols-[1.05fr_0.95fr] md:px-10">
        <section className="max-w-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#f0c38e]">
            OpenAI WebMCP Challenge · 2026
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-6xl">
            Forms that inherit the room they&apos;re in.
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#b8b3c9]">
            Inherit is not another Fillout. It is a form + booking system designed so humans
            and AI agents use the same interface — pixel-perfect visual integration through
            design tokens, and structured WebMCP tools on the live page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="rounded-full bg-[#7c5cff] px-5 py-2.5 text-sm font-semibold text-white no-underline"
            >
              Open the live form
            </Link>
            <Link
              href="/demo/atelier"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm no-underline"
            >
              Warm editorial host
            </Link>
            <Link
              href="/demo/northline"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm no-underline"
            >
              Sharp SaaS host
            </Link>
            <Link
              href="/demo/embed"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm no-underline"
            >
              Script-tag embed
            </Link>
          </div>
          <ol className="mt-12 space-y-4">
            {tools.map(([name, copy], index) => (
              <li key={name} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="font-mono text-xs text-[#7c5cff]">0{index + 1}</span>
                <div>
                  <code className="font-mono text-sm text-[#f0c38e]">{name}</code>
                  <p className="mt-1 text-sm leading-6 text-[#b8b3c9]">{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <InheritForm preset="inherit" />
        </section>
      </main>
    </div>
  );
}
