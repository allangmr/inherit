import { InheritForm } from "@/components/inherit-form";
import { SiteNav } from "@/components/site-nav";

export const metadata = {
  title: "Book a consult · Inherit",
  description:
    "Live Inherit booking form. Registers WebMCP tools on this top-level document for ChatGPT and Chrome.",
};

export default function BookPage() {
  return (
    <div className="inherit-hero site-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-xl px-6 py-10 md:px-10">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[#b8b3c9]">
          Top-level form URL · tools register here
        </p>
        <InheritForm preset="inherit" />
      </main>
    </div>
  );
}
