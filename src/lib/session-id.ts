const STORAGE_KEY = "inherit.sessionId";

export function writeSessionId(id: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, id);
}

export function readSessionId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("session");
  if (fromUrl) {
    writeSessionId(fromUrl);
    return fromUrl;
  }
  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  writeSessionId(created);
  return created;
}
