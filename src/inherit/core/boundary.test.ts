import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const coreDir = path.dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

describe("inherit core boundary", () => {
  it("does not import booking, persistence, calendar, react, or webmcp", () => {
    const files = walk(coreDir).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
    assert.ok(files.length > 0);
    const forbidden = [
      "booking-service",
      "sqlite-store",
      "file-calendar",
      "google-calendar",
      "inherit/react",
      "inherit/webmcp",
      "@inherit/react",
      "@inherit/webmcp",
      'from "react"',
      "from 'react'",
      "from \"react-dom\"",
      "document.modelContext",
      "registerTool",
    ];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const token of forbidden) {
        assert.equal(source.includes(token), false, `${path.basename(file)} imports ${token}`);
      }
    }
  });
});
