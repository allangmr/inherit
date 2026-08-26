export type HostSample = Record<string, string>;

function read(style: CSSStyleDeclaration, key: string) {
  return style.getPropertyValue(key).trim();
}

function isPainted(color: string) {
  return Boolean(color) && color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
}

function paintedBackground(element: Element | null) {
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    const color = read(getComputedStyle(node), "background-color");
    if (isPainted(color)) return color;
    node = node.parentElement;
  }
  return "";
}

export function sampleHostTokens(element: Element | null): HostSample {
  if (!element || typeof window === "undefined") return {};
  const host = getComputedStyle(element);
  const probe = document.createElement("button");
  probe.type = "button";
  probe.textContent = "Inherit probe";
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  element.appendChild(probe);
  const button = getComputedStyle(probe);
  const input = document.createElement("input");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  element.appendChild(input);
  const field = getComputedStyle(input);
  const sample: HostSample = {};
  const font = read(host, "font-family");
  const color = read(host, "color");
  const background = paintedBackground(element);
  const accent = read(button, "background-color");
  const radius = read(button, "border-radius") || read(host, "border-radius");
  const border = read(field, "border-color") || read(host, "border-color");
  if (font) {
    sample["--inh-font-family"] = font;
    sample["--inh-font-display"] = font;
  }
  if (color) sample["--inh-color-text"] = color;
  if (background) {
    sample["--inh-color-background"] = background;
    sample["--inh-color-surface"] = background;
  }
  if (isPainted(accent)) {
    sample["--inh-color-primary"] = accent;
    sample["--inh-color-ring"] = accent;
  }
  const buttonText = read(button, "color");
  if (buttonText) sample["--inh-color-primary-text"] = buttonText;
  const fieldBg = read(field, "background-color");
  if (isPainted(fieldBg)) sample["--inh-color-surface-muted"] = fieldBg;
  const fieldRadius = read(field, "border-radius");
  if (fieldRadius) sample["--inh-radius-sm"] = fieldRadius;
  const pad = read(field, "padding-top");
  if (pad) sample["--inh-space-sm"] = pad;
  if (radius) {
    sample["--inh-radius-sm"] = sample["--inh-radius-sm"] || radius;
    sample["--inh-radius-md"] = radius;
    sample["--inh-radius-lg"] = radius;
  }
  if (border) sample["--inh-color-border"] = border;
  probe.remove();
  input.remove();
  return sample;
}
