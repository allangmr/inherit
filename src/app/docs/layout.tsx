import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GuideShell } from "@/components/docs/guide-shell";
import "./guide.css";

export const metadata: Metadata = {
  title: {
    template: "%s · Inherit docs",
    default: "Inherit docs",
  },
  description:
    "Developer docs for the in-repo Inherit SDK. One WorkflowDefinition drives the human UI, WebMCP tools, validation, and domain actions.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <GuideShell>{children}</GuideShell>;
}
