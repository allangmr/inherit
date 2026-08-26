import { actorFromRequest } from "@/lib/workflow/actor";
import { saveDraft, submitWorkflowStep } from "@/lib/workflow/runtime";
import { errorResponse, isStale, json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type StepBody = {
  sessionId?: string;
  workflowId?: string;
  stepId?: string;
  values?: Record<string, string | boolean | undefined>;
  draft?: boolean;
  expectedVersion?: number;
};

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = await readJson<StepBody>(request);
    if (body.draft) {
      if (!body.sessionId) return errorResponse("sessionId is required to save a draft.");
      return json({
        ok: true,
        ...saveDraft({
          sessionId: body.sessionId,
          values: body.values ?? {},
          actor,
          expectedVersion: body.expectedVersion,
        }),
      });
    }
    if (!body.stepId) return errorResponse("stepId is required.");
    const result = submitWorkflowStep({
      sessionId: body.sessionId,
      workflowId: body.workflowId,
      stepId: body.stepId,
      values: body.values ?? {},
      actor,
      toolName: actor === "agent" ? "submit_step" : undefined,
      expectedVersion: body.expectedVersion,
    });
    return json(result, result.ok ? 200 : 422);
  } catch (error) {
    if (isStale(error)) {
      return errorResponse(error instanceof Error ? error.message : "Stale session", 409);
    }
    return errorResponse(error instanceof Error ? error.message : "Failed to submit step", 500);
  }
}
