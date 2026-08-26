import Script from "next/script";
import Link from "next/link";

export const metadata = {
  title: "Script-tag embed · Inherit",
};

export default function EmbedDemoPage() {
  return (
    <div className="inherit-hero min-h-screen px-6 py-10 text-[#f4f1ea]">
      <Script src="/inherit-embed.js" type="module" strategy="afterInteractive" />
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f0c38e]">
          &lt;inherit-form&gt; · no iframe
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Script-tag embed</h1>
        <p className="mt-3 text-sm leading-6 text-[#b8b3c9]">
          This page loads <code>/inherit-embed.js</code> and mounts the web component. Same
          APIs, same WebMCP tools on this document.{" "}
          <Link href="/" className="underline">
            Back to Inherit
          </Link>
        </p>
        <div
          className="mt-8"
          dangerouslySetInnerHTML={{
            __html: '<inherit-form theme="inherit"></inherit-form>',
          }}
        />
      </div>
    </div>
  );
}
