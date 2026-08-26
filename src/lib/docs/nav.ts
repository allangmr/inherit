export type DocPage = {
  href: string;
  label: string;
  title: string;
  blurb: string;
};

export const DOC_PAGES: DocPage[] = [
  {
    href: "/docs",
    label: "Overview",
    title: "Inherit SDK",
    blurb: "What this is for, who it is for, and four architecture diagrams.",
  },
  {
    href: "/docs/install",
    label: "Install",
    title: "Install",
    blurb: "Clone the repo and import workspace paths. npm is not live yet.",
  },
  {
    href: "/docs/quickstart",
    label: "Quickstart",
    title: "Quickstart",
    blurb: "Define a workflow, create the runtime, render React, register tools.",
  },
  {
    href: "/docs/workflows",
    label: "Workflows",
    title: "Workflows",
    blurb: "WorkflowDefinition: steps, fields, actions, and live capabilities.",
  },
  {
    href: "/docs/react",
    label: "React",
    title: "React",
    blurb: "InheritProvider and the hooks that read the shared session.",
  },
  {
    href: "/docs/webmcp",
    label: "WebMCP",
    title: "WebMCP",
    blurb: "Feature-detect modelContext, register tools, tear them down with AbortSignal.",
  },
  {
    href: "/docs/api",
    label: "API",
    title: "API reference",
    blurb: "Exported symbols from @inherit/core, @inherit/react, and @inherit/webmcp.",
  },
];

export function docPageAt(href: string) {
  return DOC_PAGES.find((page) => page.href === href) ?? DOC_PAGES[0];
}

export function adjacentDocs(href: string) {
  const index = DOC_PAGES.findIndex((page) => page.href === href);
  return {
    previous: index > 0 ? DOC_PAGES[index - 1] : null,
    next: index >= 0 && index < DOC_PAGES.length - 1 ? DOC_PAGES[index + 1] : null,
  };
}
