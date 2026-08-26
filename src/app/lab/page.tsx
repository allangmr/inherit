import { InheritForm } from "@/components/inherit-form";
import { SiteNav } from "@/components/site-nav";
import { WebMcpLab } from "@/components/webmcp-lab";

export const metadata = {
  title: "WebMCP lab · Inherit",
  description:
    "Register Inherit tools on this document and invoke them through Chrome's WebMCP consumer API.",
};

export default function LabPage() {
  return (
    <div className="inherit-hero site-shell">
      <SiteNav />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-[minmax(0,22rem)_1fr] md:px-10">
        <div>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#b8b3c9]">
            Form registers tools here
          </p>
          <InheritForm preset="inherit" compact sessionKey="webmcp-lab" />
        </div>
        <WebMcpLab />
      </main>
    </div>
  );
}
