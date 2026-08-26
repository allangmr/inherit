import { actorFromRequest } from "@inherit/core";
import { dispatchAction } from "@/lib/inherit-runtime";
import { errorResponse, isStale, json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type BookBody = {
  sessionId?: string;
  workflowId?: string;
  slotId?: string;
  values?: Record<string, string | boolean | undefined>;
  expectedVersion?: number;
};

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = await readJson<BookBody>(request);
    if (!body.slotId) return errorResponse("slotId is required.");
    const result = await dispatchAction({
      sessionId: body.sessionId,
      workflowId: body.workflowId,
      action: "book_slot",
      actor,
      toolName: actor === "agent" ? "book_slot" : undefined,
      expectedVersion: body.expectedVersion,
      payload: { slotId: body.slotId, values: body.values ?? {} },
    });
    return json(result, result.ok ? 200 : 422);
  } catch (error) {
    if (isStale(error)) {
      return errorResponse(error instanceof Error ? error.message : "Stale session", 409);
    }
    return errorResponse(error instanceof Error ? error.message : "Failed to book slot", 500);
  }
}
