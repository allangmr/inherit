import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src/inherit");

export const INDEX_FILES = {
  core: path.join(ROOT, "core/index.ts"),
  react: path.join(ROOT, "react/index.tsx"),
  webmcp: path.join(ROOT, "webmcp/index.ts"),
} as const;

export function parseExportedNames(source: string): string[] {
  const names = new Set<string>();
  const blocks = source.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g);
  for (const match of blocks) {
    for (const part of match[1].split(",")) {
      const token = part.trim().split(/\s+as\s+/).pop()?.replace(/[^\w]/g, "");
      if (token) names.add(token);
    }
  }
  const singles = source.matchAll(
    /export\s+(?:async\s+)?(?:function|class|const|type|let|var)\s+(\w+)/g,
  );
  for (const match of singles) names.add(match[1]);
  return [...names].sort();
}

export function readPackageExports() {
  return {
    core: parseExportedNames(fs.readFileSync(INDEX_FILES.core, "utf8")),
    react: parseExportedNames(fs.readFileSync(INDEX_FILES.react, "utf8")),
    webmcp: parseExportedNames(fs.readFileSync(INDEX_FILES.webmcp, "utf8")),
  };
}
