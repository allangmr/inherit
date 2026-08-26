import { DemoSwitcher } from "@/components/demo-switcher";
import { InheritForm } from "@/components/inherit-form";
import Link from "next/link";

export const metadata = {
  title: "Studio Nocturne · Creative brief",
  description: "A second Inherit workflow. Same runtime as the booking demo, different steps and tools.",
};

export default function StudioPage() {
  return (
    <div className="studio-page min-h-screen">
      <DemoSwitcher />
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <header className="flex items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#7dffb3]">
              Studio Nocturne
            </p>
            <h1 className="mt-2 text-5xl font-semibold tracking-[-0.04em]">Write the brief together.</h1>
          </div>
          <Link href="/demo/atelier" className="text-sm text-[#7dffb3]">
            The booking twin
          </Link>
        </header>
        <div className="grid gap-14 py-12 lg:grid-cols-[1fr_28rem]">
          <article className="max-w-xl text-[#c9d6cc]">
            <p className="text-xl leading-8">
              Completely different steps. Same Inherit runtime. A human can type the goal, an agent
              can suggest a deliverable, and both write the same session.
            </p>
            <p className="mt-6 text-sm leading-7">
              Tools on this page are brief tools, not calendar tools. Open the inspector to watch
              <code className="mx-1 text-[#7dffb3]">get_brief_schema</code>
              replace
              <code className="mx-1 text-[#7dffb3]">book_slot</code>.
            </p>
          </article>
          <aside>
            <InheritForm preset="host" compact sessionKey="studio-brief" workflowId="brief" />
          </aside>
        </div>
      </div>
    </div>
  );
}
