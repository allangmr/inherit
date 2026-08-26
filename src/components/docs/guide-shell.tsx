import type { ReactNode } from "react";
import { Suspense } from "react";
import { SiteNav } from "@/components/site-nav";
import { inheritTokens, tokensToCssVars } from "@/lib/tokens";
import { GuideNav } from "./guide-nav";

export function GuideShell({ children }: { children: ReactNode }) {
  return (
    <div className="guide-page inherit-hero" style={tokensToCssVars(inheritTokens)}>
      <SiteNav />
      <div className="guide-frame">
        <Suspense fallback={<nav className="guide-side" aria-hidden="true" />}>
          <GuideNav variant="side" />
        </Suspense>
        <div className="guide-main">
          <Suspense fallback={null}>
            <GuideNav variant="mobile" />
          </Suspense>
          {children}
        </div>
      </div>
    </div>
  );
}
