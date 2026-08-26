import { getWorkflowState } from "@/lib/workflow/session";
import { errorResponse, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    const workflowId = url.searchParams.get("workflowId");
    return json({ ok: true, ...getWorkflowState(sessionId, workflowId) });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load form", 500);
  }
}
