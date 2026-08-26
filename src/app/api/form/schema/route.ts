import { getFormState } from "@/lib/booking-service";
import { errorResponse, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    return json({ ok: true, ...getFormState(sessionId) });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load form", 500);
  }
}
