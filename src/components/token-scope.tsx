"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { sampleHostTokens } from "@/lib/host-tokens";
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
};

export function TokenScope({
  preset = "inherit",
  tokens,
  children,
  className,
}: TokenScopeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hostVars, setHostVars] = useState<Record<string, string>>({});
  const resolved = mergeTokens(tokenPresets[preset] ?? tokenPresets.inherit, tokens);
  const style = {
    ...tokensToCssVars(resolved),
    ...(preset === "host" ? hostVars : {}),
  } as CSSProperties;

  useEffect(() => {
    if (preset !== "host") return;
    setHostVars(sampleHostTokens(ref.current?.parentElement ?? null));
  }, [preset]);

  return (
    <div ref={ref} className={`inh-root ${className ?? ""}`.trim()} style={style}>
      {children}
    </div>
  );
}
