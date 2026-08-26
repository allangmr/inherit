import Link from "next/link";
import { InheritForm } from "@/components/inherit-form";
import { SiteNav } from "@/components/site-nav";

const ideas = [
  ["One definition", "Steps, validation, actions, and WebMCP metadata live in the workflow."],
  ["Two operators", "A person filling a field and an agent calling a tool write the same session."],
  ["Live capabilities", "book_slot disappears after confirmation. reschedule_booking takes its place."],
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
            One workflow. Shared by humans and agents.
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#b8b3c9]">
            Inherit is an SDK for web workflows that people and AI agents complete together.
            Same state. Same validation. Same permissions. Booking is one demo app built with it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo/atelier"
              className="rounded-full bg-[#7c5cff] px-5 py-2.5 text-sm font-semibold text-white no-underline"
            >
              Appointment demo
            </Link>
            <Link
              href="/demo/studio"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm no-underline"
            >
              Creative brief
            </Link>
            <Link
              href="/book"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm no-underline"
            >
              ChatGPT URL
            </Link>
            <Link
              href="/demo/atelier?inspect=1"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm no-underline"
            >
              Inspector
            </Link>
          </div>
          <ol className="mt-12 space-y-4">
            {ideas.map(([name, copy], index) => (
              <li key={name} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="font-mono text-xs text-[#7c5cff]">0{index + 1}</span>
                <div>
                  <p className="font-medium">{name}</p>
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
