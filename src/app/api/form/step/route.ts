import { saveDraft, submitStep } from "@/lib/booking-service";
import { errorResponse, json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type StepBody = {
  sessionId?: string;
  stepId?: string;
  values?: Record<string, string | boolean | undefined>;
  draft?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<StepBody>(request);
    if (body.draft) {
      if (!body.sessionId) return errorResponse("sessionId is required to save a draft.");
      return json({ ok: true, ...saveDraft(body.sessionId, body.values ?? {}) });
    }
    if (!body.stepId) return errorResponse("stepId is required.");
    const result = submitStep(body.sessionId, body.stepId, body.values ?? {});
    return json(result, result.ok ? 200 : 422);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to submit step", 500);
  }
}
