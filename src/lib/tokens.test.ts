import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inheritTokens, mergeTokens, tokensToCssVars } from "./tokens";

describe("design tokens", () => {
  it("emits CSS variables for every token group", () => {
    const vars = tokensToCssVars(inheritTokens);
    assert.equal(vars["--inh-color-primary"], inheritTokens.colors.primary);
    assert.equal(vars["--inh-radius-md"], inheritTokens.radius.md);
    assert.equal(vars["--inh-font-family"], inheritTokens.typography.fontFamily);
  });

  it("merges a host override without dropping defaults", () => {
    const merged = mergeTokens(inheritTokens, {
      colors: { primary: "#111111" },
    });
    assert.equal(merged.colors.primary, "#111111");
    assert.equal(merged.colors.background, inheritTokens.colors.background);
  });
});
