import { DemoSwitcher } from "@/components/demo-switcher";
import { InheritForm } from "@/components/inherit-form";
import Link from "next/link";

export const metadata = {
  title: "Atelier Lumen · Book a sitting",
  description: "Warm editorial host demo. The booking card is one Inherit workflow, not the product.",
};

export default function AtelierPage() {
  return (
    <div className="atelier-page min-h-screen">
      <DemoSwitcher />
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <header className="flex items-end justify-between gap-6 border-b border-[#2b1d12]/15 pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#b8431f]">
              Portland · Est. 2014
            </p>
            <h1
              className="mt-2 text-5xl leading-none"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Atelier Lumen
            </h1>
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            <span>Sittings</span>
            <span>Prints</span>
            <span>The studio</span>
            <Link href="/" className="underline decoration-[#c4a36a] underline-offset-4">
              Inherit
            </Link>
          </nav>
        </header>

        <div className="grid gap-16 py-14 lg:grid-cols-[1fr_26rem]">
          <article className="max-w-xl">
            <p
              className="text-2xl leading-snug italic text-[#6d5644]"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Light, then likeness. A half-hour consult to decide how the sitting should feel.
            </p>
            <p className="mt-6 text-lg leading-8">
              This page is a fake studio on purpose. The card on the right is an Inherit workflow
              wearing Atelier&apos;s paper, terracotta, and serif. A person and an agent share the
              same session. Add <code>?inspect=1</code> to watch the tools change.
            </p>
          </article>
          <aside>
            <InheritForm preset="atelier" compact sessionKey="atelier-host" workflowId="booking" />
          </aside>
        </div>
      </div>
    </div>
  );
}
