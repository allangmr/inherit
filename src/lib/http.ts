export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function errorResponse(message: string, status = 400, extra?: Record<string, unknown>) {
  return json({ ok: false, error: message, ...extra }, status);
}

export { isStale } from "@inherit/core";
