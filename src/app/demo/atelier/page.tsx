import Link from "next/link";
import { InheritForm } from "@/components/inherit-form";

export const metadata = {
  title: "Atelier Lumen · Book a sitting",
  description: "Warm editorial host demo. Inherit reads the studio's tokens and disappears into the page.",
};

export default function AtelierPage() {
  return (
    <div className="atelier-page min-h-screen">
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
              This page is a fake studio on purpose. The booking card on the right is the same
              Inherit form as the indigo SaaS demo — it only inherited cream paper, terracotta,
              and a serif. No theme fork. No iframe chrome.
            </p>
            <dl className="mt-10 grid gap-6 text-sm sm:grid-cols-3">
              <div>
                <dt className="uppercase tracking-[0.18em] text-[#6d5644]">Duration</dt>
                <dd className="mt-1 text-xl">30 minutes</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-[#6d5644]">Capacity</dt>
                <dd className="mt-1 text-xl">3 per slot</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-[#6d5644]">Place</dt>
                <dd className="mt-1 text-xl">Alberta, or video</dd>
              </div>
            </dl>
            <blockquote className="mt-12 border-l-2 border-[#c4a36a] pl-5 text-[#6d5644]">
              Tokens, not screenshots. If the host changes `--inh-color-primary`, the form
              follows.
            </blockquote>
          </article>
          <aside>
            <InheritForm preset="atelier" compact />
          </aside>
        </div>
      </div>
    </div>
  );
}
