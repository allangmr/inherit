import { InheritForm } from "@/components/inherit-form";
import { SiteNav } from "@/components/site-nav";
import { WebMcpLab } from "@/components/webmcp-lab";

export const metadata = {
  title: "Book a consult · Inherit",
  description:
    "Live Inherit booking form. Registers WebMCP tools on this top-level document for ChatGPT and Chrome.",
};

export default function BookPage() {
  return (
    <div className="inherit-hero site-shell">
      <SiteNav />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,28rem)_1fr] md:px-10">
        <div>
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[#b8b3c9]">
            Top-level form URL · tools register here
          </p>
          <InheritForm preset="inherit" />
        </div>
        <WebMcpLab />
      </main>
    </div>
  );
}
