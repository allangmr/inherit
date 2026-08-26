export function sessionStorageKey(namespace?: string) {
  return namespace ? `inherit.sessionId.${namespace}` : "inherit.sessionId";
}

export function writeSessionId(id: string, namespace?: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(sessionStorageKey(namespace), id);
}

export function readSessionId(namespace?: string) {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("session");
  if (fromUrl && !namespace) {
    writeSessionId(fromUrl);
    return fromUrl;
  }
  const existing = window.sessionStorage.getItem(sessionStorageKey(namespace));
  if (existing) return existing;
  const created = crypto.randomUUID();
  writeSessionId(created, namespace);
  return created;
}
