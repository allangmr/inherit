import type { Actor } from "./models";

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

export function spokenActor(actor: Actor) {
  if (actor === "agent") return "ChatGPT";
  if (actor === "system") return "System";
  return "You";
}
