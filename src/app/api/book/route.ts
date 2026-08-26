import { bookSlot } from "@/lib/booking-service";
import { errorResponse, json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type BookBody = {
  sessionId?: string;
  slotId?: string;
  values?: Record<string, string | boolean | undefined>;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<BookBody>(request);
    if (!body.slotId) return errorResponse("slotId is required.");
    const result = await bookSlot({
      sessionId: body.sessionId,
      slotId: body.slotId,
      values: body.values,
    });
    return json(result, result.ok ? 200 : 422);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to book slot", 500);
  }
}
