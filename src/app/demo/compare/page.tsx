import Link from "next/link";
import { DemoSwitcher } from "@/components/demo-switcher";
import { HostSystem } from "@/components/host-system";
import { InheritForm } from "@/components/inherit-form";

export const metadata = {
  title: "Compare host design systems · Inherit",
  description:
    "Same Inherit form embedded in two client design systems. Compare host controls vs the form.",
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f4f1ea]">
      <DemoSwitcher />
      <header className="border-b border-white/10 px-6 py-5 md:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f0c38e]">
          Side-by-side · same component
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Does the form inherit the client?
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#b8b3c9]">
          Left is Atelier Lumen (editorial). Right is Northline (SaaS). Each column shows the
          host&apos;s own buttons and inputs first, then the same Inherit form. If inheritance
          works, primary color, radius, and type match the host — not Inherit&apos;s indigo brand.{" "}
          <Link href="/" className="underline">
            Back
          </Link>
        </p>
      </header>
      <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-2">
        <section className="atelier-page px-5 py-8 md:px-8">
          <p
            className="text-[11px] uppercase tracking-[0.22em] text-[#b8431f]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Client A · Atelier Lumen
          </p>
          <h2
            className="mt-2 text-4xl text-[#2b1d12]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Cream paper, terracotta, serif.
          </h2>
          <div className="mt-6">
            <HostSystem preset="atelier" client="Atelier" />
            <InheritForm preset="atelier" compact sessionKey="compare-atelier" registerTools={false} />
          </div>
        </section>
        <section className="northline-page border-t border-white/10 px-5 py-8 lg:border-l lg:border-t-0 md:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#3ee0c5]">
            Client B · Northline
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
            Near-black, electric blue, 2px.
          </h2>
          <div className="mt-6">
            <HostSystem preset="northline" client="Northline" />
            <InheritForm preset="northline" compact sessionKey="compare-northline" registerTools={false} />
          </div>
        </section>
      </div>
    </div>
  );
}
