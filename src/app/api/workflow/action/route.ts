import { actorFromRequest } from "@inherit/core";
import { dispatchAction } from "@/lib/inherit-runtime";
import { errorResponse, isStale, json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type ActionBody = {
  sessionId?: string;
  workflowId?: string;
  action?: string;
  payload?: Record<string, unknown>;
  expectedVersion?: number;
};

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = await readJson<ActionBody>(request);
    if (!body.action) return errorResponse("action is required.");
    const result = await dispatchAction({
      sessionId: body.sessionId,
      workflowId: body.workflowId,
      action: body.action,
      payload: body.payload ?? {},
      actor,
      toolName: actor === "agent" ? body.action : undefined,
      expectedVersion: body.expectedVersion,
    });
    return json(result, result.ok ? 200 : 422);
  } catch (error) {
    if (isStale(error)) {
      return errorResponse(error instanceof Error ? error.message : "Stale session", 409);
    }
    return errorResponse(error instanceof Error ? error.message : "Failed to run action", 500);
  }
}
