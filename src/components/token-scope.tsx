import type { CSSProperties, ReactNode } from "react";
import {
  mergeTokens,
  tokenPresets,
  tokensToCssVars,
  type DesignTokens,
  type TokenPreset,
} from "@/lib/tokens";

type TokenScopeProps = {
  preset?: TokenPreset;
  tokens?: Partial<DesignTokens>;
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "main";
};

export function TokenScope({
  preset = "inherit",
  tokens,
  children,
  className,
  as: Tag = "div",
}: TokenScopeProps) {
  const resolved = mergeTokens(tokenPresets[preset], tokens);
  const style = tokensToCssVars(resolved) as CSSProperties;
  return (
    <Tag className={`inh-root ${className ?? ""}`.trim()} style={style}>
      {children}
    </Tag>
  );
}
