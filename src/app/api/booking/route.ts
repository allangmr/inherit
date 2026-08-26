import { getBookingStatus } from "@/lib/booking-service";
import { errorResponse, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = getBookingStatus({
      email: url.searchParams.get("email") ?? undefined,
      bookingId: url.searchParams.get("bookingId") ?? undefined,
    });
    return json(result, result.ok ? 200 : 400);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to look up booking", 500);
  }
}
