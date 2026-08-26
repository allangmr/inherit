import type { WebMcpStatus } from "@/lib/webmcp";

const labels: Record<WebMcpStatus, string> = {
  ready: "Agent tools ready",
  registering: "Registering tools",
  unavailable: "WebMCP not available",
  error: "WebMCP error",
};

export function WebMcpIndicator({ status }: { status: WebMcpStatus }) {
  return (
    <span className="inh-status" data-state={status}>
      <i aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
