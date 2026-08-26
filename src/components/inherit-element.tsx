"use client";

import { createElement, useEffect } from "react";

export function InheritElement({
  theme = "inherit",
  tokens,
}: {
  theme?: string;
  tokens?: string;
}) {
  useEffect(() => {
    if (!document.querySelector('script[data-inherit-embed="true"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/inherit-embed.js";
      script.dataset.inheritEmbed = "true";
      document.body.appendChild(script);
    }
  }, []);

  return createElement("inherit-form", { theme, tokens });
}
