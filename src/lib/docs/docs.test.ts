import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { API_CATALOG, catalogNames } from "./api-catalog";
import { DOC_PAGES } from "./nav";
import { readPackageExports } from "./exports";
import { SNIPPET_CLONE, SNIPPET_NPM_FUTURE } from "./snippets";

const ROOT = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

describe("docs site", () => {
  it("ships the recommended /docs routes", () => {
    const expected = [
      "src/app/docs/page.tsx",
      "src/app/docs/install/page.tsx",
      "src/app/docs/quickstart/page.tsx",
      "src/app/docs/workflows/page.tsx",
      "src/app/docs/react/page.tsx",
      "src/app/docs/webmcp/page.tsx",
      "src/app/docs/api/page.tsx",
    ];
    for (const file of expected) {
      assert.equal(fs.existsSync(path.join(ROOT, file)), true, `missing ${file}`);
    }
    assert.deepEqual(
      DOC_PAGES.map((page) => page.href),
      [
        "/docs",
        "/docs/install",
        "/docs/quickstart",
        "/docs/workflows",
        "/docs/react",
        "/docs/webmcp",
        "/docs/api",
      ],
    );
  });

  it("documents every public export from the SDK index files", () => {
    const exported = readPackageExports();
    const byPkg = {
      core: API_CATALOG.filter((item) => item.pkg === "core").map((item) => item.name).sort(),
      react: API_CATALOG.filter((item) => item.pkg === "react").map((item) => item.name).sort(),
      webmcp: API_CATALOG.filter((item) => item.pkg === "webmcp").map((item) => item.name).sort(),
    };
    assert.deepEqual(byPkg.core, exported.core);
    assert.deepEqual(byPkg.react, exported.react);
    assert.deepEqual(byPkg.webmcp, exported.webmcp);
    assert.equal(new Set(catalogNames()).size, catalogNames().length);
  });

  it("keeps install honest about npm", () => {
    const page = read("src/app/docs/install/page.tsx");
    assert.match(page, /Coming when published/);
    assert.match(page, /private: true/);
    assert.match(SNIPPET_CLONE, /git clone https:\/\/github.com\/allangmr\/inherit.git/);
    assert.match(SNIPPET_NPM_FUTURE, /npm install inherit/);
    assert.equal(page.includes("comingSoon"), true);
    assert.equal(/\bnpm install inherit@\d/.test(page + SNIPPET_NPM_FUTURE), false);
    assert.equal(page.includes("registry.npmjs"), false);
  });

  it("links / and /docs in the site nav and landing", () => {
    const nav = read("src/components/site-nav.tsx");
    const landing = read("src/components/landing/docs-landing.tsx");
    assert.match(nav, /href: "\/docs"/);
    assert.match(nav, /href="\/"/);
    assert.match(landing, /href="\/docs"/);
    assert.match(read("src/components/docs/guide-nav.tsx"), /href="\/"/);
  });
});
