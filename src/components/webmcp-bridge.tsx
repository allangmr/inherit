"use client";

import { useEffect, useState } from "react";
import { createWorkflowTools, toolsNamed } from "@/lib/inherit-tools";
import {
  getModelContext,
  isSecureContextForWebMcp,
  registerTools,
  type WebMcpStatus,
} from "@/lib/webmcp";
import { WebMcpIndicator } from "./webmcp-indicator";

type WebMcpBridgeProps = {
  sessionId: string;
  workflowId?: string;
  exposedTo?: string[];
  enabled?: boolean;
  capabilityNames?: string[];
};

function initialStatus(enabled: boolean): WebMcpStatus {
  if (!enabled || typeof window === "undefined") return "unavailable";
  const context = getModelContext();
  if (!context || !isSecureContextForWebMcp()) return "unavailable";
  return "registering";
}

export function WebMcpBridge({
  sessionId,
  workflowId = "booking",
  exposedTo,
  enabled = true,
  capabilityNames = [],
}: WebMcpBridgeProps) {
  const [status, setStatus] = useState<WebMcpStatus>(() => initialStatus(enabled));
  const namesKey = capabilityNames.join(",");

  useEffect(() => {
    if (!enabled || sessionId === "pending") return;
    const controller = new AbortController();
    const context = getModelContext();

    if (!context || !isSecureContextForWebMcp()) {
      return () => controller.abort();
    }

    const catalog = createWorkflowTools(
      () => sessionId,
      () => workflowId,
    );
    const fallback =
      workflowId === "brief"
        ? ["get_brief_schema", "update_brief"]
        : ["get_form_schema", "submit_step"];
    const selected = toolsNamed(catalog, namesKey ? namesKey.split(",") : fallback);

    registerTools(selected, { signal: controller.signal, exposedTo })
      .then((result) => {
        if (!controller.signal.aborted) {
          setStatus(result.supported ? "ready" : "unavailable");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => controller.abort();
  }, [sessionId, workflowId, exposedTo, enabled, namesKey]);

  return <WebMcpIndicator status={status} />;
}
