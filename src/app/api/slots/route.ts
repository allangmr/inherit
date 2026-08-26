import { listAvailableSlots } from "@/lib/booking-service";
import { errorResponse, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data = await listAvailableSlots({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    return json({ ok: true, ...data });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to list slots", 500);
  }
}
