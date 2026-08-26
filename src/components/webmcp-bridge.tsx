"use client";

import { useEffect, useRef, useState } from "react";
import type { Capability } from "@inherit/core";
import {
  createWebMcpAdapter,
  getModelContext,
  isSecureContextForWebMcp,
  registerWorkflowTools,
  type WebMcpStatus,
} from "@inherit/webmcp";
import { WebMcpIndicator } from "./webmcp-indicator";

type WebMcpBridgeProps = {
  sessionId: string;
  workflowId?: string;
  exposedTo?: string[];
  enabled?: boolean;
  capabilities?: Capability[];
  schemaToolName?: string;
  submitToolName?: string;
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
  capabilities = [],
  schemaToolName = "get_form_schema",
  submitToolName = "submit_step",
}: WebMcpBridgeProps) {
  const [status, setStatus] = useState<WebMcpStatus>(() => initialStatus(enabled));
  const namesKey = capabilities.map((capability) => capability.name).join(",");
  const capabilitiesRef = useRef(capabilities);

  useEffect(() => {
    capabilitiesRef.current = capabilities;
  }, [capabilities]);

  useEffect(() => {
    if (!enabled || sessionId === "pending") return;
    const controller = new AbortController();
    const context = getModelContext();

    if (!context || !isSecureContextForWebMcp()) {
      return () => controller.abort();
    }

    const adapter = createWebMcpAdapter({
      getSessionId: () => sessionId,
      getWorkflowId: () => workflowId,
    });

    registerWorkflowTools(
      adapter,
      capabilitiesRef.current,
      { schemaToolName, submitToolName },
      { signal: controller.signal, exposedTo },
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setStatus(result.supported ? "ready" : "unavailable");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => controller.abort();
  }, [sessionId, workflowId, exposedTo, enabled, namesKey, schemaToolName, submitToolName]);

  return <WebMcpIndicator status={status} />;
}
