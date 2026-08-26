export type DesignTokens = {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    accent: string;
    border: string;
    danger: string;
    success: string;
    ring: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  typography: {
    fontFamily: string;
    fontFamilyDisplay: string;
    fontFamilyMono: string;
    fontSizeBase: string;
    lineHeight: string;
    tracking: string;
    displayTracking: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
};

export const inheritTokens: DesignTokens = {
  colors: {
    background: "#0f1220",
    surface: "#171b2e",
    surfaceMuted: "#1f2540",
    text: "#f4f1ea",
    textMuted: "#b8b3c9",
    primary: "#7c5cff",
    primaryText: "#ffffff",
    accent: "#f0c38e",
    border: "rgba(244, 241, 234, 0.12)",
    danger: "#f07167",
    success: "#6ee7b7",
    ring: "rgba(124, 92, 255, 0.45)",
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "22px",
    full: "999px",
  },
  typography: {
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontFamilyDisplay: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontFamilyMono: "var(--font-geist-mono), ui-monospace, monospace",
    fontSizeBase: "16px",
    lineHeight: "1.55",
    tracking: "-0.011em",
    displayTracking: "-0.035em",
  },
  spacing: {
    xs: "0.35rem",
    sm: "0.65rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2.25rem",
  },
  shadows: {
    sm: "0 1px 0 rgba(255,255,255,0.04)",
    md: "0 18px 50px -24px rgba(10, 8, 24, 0.8)",
    lg: "0 40px 80px -36px rgba(8, 6, 20, 0.9)",
  },
};

export const atelierTokens: DesignTokens = {
  colors: {
    background: "#f3eadc",
    surface: "#fff8ee",
    surfaceMuted: "#efe3d2",
    text: "#2b1d12",
    textMuted: "#6d5644",
    primary: "#b8431f",
    primaryText: "#fff8ee",
    accent: "#c4a36a",
    border: "rgba(43, 29, 18, 0.14)",
    danger: "#9b2c1a",
    success: "#3d6b4f",
    ring: "rgba(184, 67, 31, 0.28)",
  },
  radius: {
    sm: "2px",
    md: "4px",
    lg: "8px",
    full: "999px",
  },
  typography: {
    fontFamily: "var(--font-source-serif), 'Iowan Old Style', Georgia, serif",
    fontFamilyDisplay: "var(--font-fraunces), 'Iowan Old Style', Georgia, serif",
    fontFamilyMono: "var(--font-geist-mono), ui-monospace, monospace",
    fontSizeBase: "17px",
    lineHeight: "1.65",
    tracking: "0.005em",
    displayTracking: "-0.02em",
  },
  spacing: {
    xs: "0.4rem",
    sm: "0.75rem",
    md: "1.15rem",
    lg: "1.75rem",
    xl: "2.75rem",
  },
  shadows: {
    sm: "0 1px 0 rgba(43, 29, 18, 0.06)",
    md: "0 16px 40px -28px rgba(43, 29, 18, 0.35)",
    lg: "0 28px 70px -34px rgba(43, 29, 18, 0.28)",
  },
};

export const northlineTokens: DesignTokens = {
  colors: {
    background: "#07090d",
    surface: "#0d1118",
    surfaceMuted: "#151b25",
    text: "#e8eef7",
    textMuted: "#8b97a8",
    primary: "#2f6dff",
    primaryText: "#f4f7ff",
    accent: "#3ee0c5",
    border: "rgba(232, 238, 247, 0.1)",
    danger: "#ff5d73",
    success: "#3ee0c5",
    ring: "rgba(47, 109, 255, 0.5)",
  },
  radius: {
    sm: "0px",
    md: "2px",
    lg: "4px",
    full: "999px",
  },
  typography: {
    fontFamily: "var(--font-ibm-plex), ui-sans-serif, system-ui, sans-serif",
    fontFamilyDisplay: "var(--font-ibm-plex), ui-sans-serif, system-ui, sans-serif",
    fontFamilyMono: "var(--font-ibm-mono), ui-monospace, monospace",
    fontSizeBase: "15px",
    lineHeight: "1.45",
    tracking: "-0.018em",
    displayTracking: "-0.04em",
  },
  spacing: {
    xs: "0.3rem",
    sm: "0.5rem",
    md: "0.85rem",
    lg: "1.25rem",
    xl: "2rem",
  },
  shadows: {
    sm: "none",
    md: "0 0 0 1px rgba(232, 238, 247, 0.06)",
    lg: "0 24px 60px -32px rgba(0, 0, 0, 0.7)",
  },
};

export const tokenPresets = {
  inherit: inheritTokens,
  atelier: atelierTokens,
  northline: northlineTokens,
} as const;

export type TokenPreset = keyof typeof tokenPresets;

const cssVarMap: Array<[string, (tokens: DesignTokens) => string]> = [
  ["--inh-color-background", (t) => t.colors.background],
  ["--inh-color-surface", (t) => t.colors.surface],
  ["--inh-color-surface-muted", (t) => t.colors.surfaceMuted],
  ["--inh-color-text", (t) => t.colors.text],
  ["--inh-color-text-muted", (t) => t.colors.textMuted],
  ["--inh-color-primary", (t) => t.colors.primary],
  ["--inh-color-primary-text", (t) => t.colors.primaryText],
  ["--inh-color-accent", (t) => t.colors.accent],
  ["--inh-color-border", (t) => t.colors.border],
  ["--inh-color-danger", (t) => t.colors.danger],
  ["--inh-color-success", (t) => t.colors.success],
  ["--inh-color-ring", (t) => t.colors.ring],
  ["--inh-radius-sm", (t) => t.radius.sm],
  ["--inh-radius-md", (t) => t.radius.md],
  ["--inh-radius-lg", (t) => t.radius.lg],
  ["--inh-radius-full", (t) => t.radius.full],
  ["--inh-font-family", (t) => t.typography.fontFamily],
  ["--inh-font-display", (t) => t.typography.fontFamilyDisplay],
  ["--inh-font-mono", (t) => t.typography.fontFamilyMono],
  ["--inh-font-size", (t) => t.typography.fontSizeBase],
  ["--inh-line-height", (t) => t.typography.lineHeight],
  ["--inh-tracking", (t) => t.typography.tracking],
  ["--inh-display-tracking", (t) => t.typography.displayTracking],
  ["--inh-space-xs", (t) => t.spacing.xs],
  ["--inh-space-sm", (t) => t.spacing.sm],
  ["--inh-space-md", (t) => t.spacing.md],
  ["--inh-space-lg", (t) => t.spacing.lg],
  ["--inh-space-xl", (t) => t.spacing.xl],
  ["--inh-shadow-sm", (t) => t.shadows.sm],
  ["--inh-shadow-md", (t) => t.shadows.md],
  ["--inh-shadow-lg", (t) => t.shadows.lg],
];

export function tokensToCssVars(tokens: DesignTokens): Record<string, string> {
  return Object.fromEntries(cssVarMap.map(([key, read]) => [key, read(tokens)]));
}

export function cssVarsToInlineStyle(tokens: DesignTokens): string {
  return Object.entries(tokensToCssVars(tokens))
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function mergeTokens(
  base: DesignTokens,
  override?: DeepPartial<DesignTokens> | null,
): DesignTokens {
  if (!override) return base;
  return {
    colors: { ...base.colors, ...override.colors },
    radius: { ...base.radius, ...override.radius },
    typography: { ...base.typography, ...override.typography },
    spacing: { ...base.spacing, ...override.spacing },
    shadows: { ...base.shadows, ...override.shadows },
  };
}

export function parseTokenOverride(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<DesignTokens>;
  } catch {
    return null;
  }
}
