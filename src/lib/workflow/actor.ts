import type { Actor } from "@/lib/store";

export function parseActor(raw: unknown): Actor {
  if (raw === "agent" || raw === "system") return raw;
  return "human";
}

export function actorFromRequest(request: Request): Actor {
  return parseActor(request.headers.get("x-inherit-actor"));
}

export function actorHeaders(actor: Actor): HeadersInit {
  return { "x-inherit-actor": actor };
}
