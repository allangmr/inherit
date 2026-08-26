import type { Metadata } from "next";
import { GuidePager } from "@/components/docs/guide-pager";
import { API_CATALOG, type ApiKind, type ApiPackage } from "@/lib/docs/api-catalog";

export const metadata: Metadata = {
  title: "API reference",
  description:
    "Exported symbols from @inherit/core, @inherit/react, and @inherit/webmcp. Public index files only.",
};

const packages: Array<{ id: ApiPackage; title: string; intro: string }> = [
  {
    id: "core",
    title: "@inherit/core",
    intro:
      "src/inherit/core/index.ts. Workflow definition, runtime, capabilities, form projection, session helpers.",
  },
  {
    id: "react",
    title: "@inherit/react",
    intro: "src/inherit/react/index.tsx. Client provider and hooks over /api/form/schema.",
  },
  {
    id: "webmcp",
    title: "@inherit/webmcp",
    intro: "src/inherit/webmcp/index.ts. modelContext detection, adapter, and registration.",
  },
];

function kindLabel(kind: ApiKind) {
  if (kind === "fn") return "fn";
  if (kind === "class") return "class";
  if (kind === "const") return "const";
  return "type";
}

export default function DocsApiPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">API</p>
      <h1>What the index files export.</h1>
      <p className="guide-lede">
        These names come from the three public entry files. Private helpers inside{" "}
        <code>runtime.ts</code> or the adapter are not listed. Imports use the{" "}
        <code>@inherit/*</code> workspace paths.
      </p>

      {packages.map((pkg) => {
        const rows = API_CATALOG.filter((item) => item.pkg === pkg.id);
        return (
          <section key={pkg.id}>
            <h2>{pkg.title}</h2>
            <p>{pkg.intro}</p>
            <div className="guide-table-wrap">
              <table className="guide-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Kind</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>
                        <span className="guide-kind">{kindLabel(item.kind)}</span>
                      </td>
                      <td>{item.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="guide-note">
        Core does not import React, WebMCP, SQLite, or the booking service. That boundary is
        tested in <code>src/inherit/core/boundary.test.ts</code>.
      </p>
      <GuidePager href="/docs/api" />
    </article>
  );
}
