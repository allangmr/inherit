"use client";

import { useEffect, useState } from "react";
import { createInheritTools } from "@/lib/inherit-tools";
import {
  getModelContext,
  isSecureContextForWebMcp,
  registerTools,
  type WebMcpStatus,
} from "@/lib/webmcp";
import { WebMcpIndicator } from "./webmcp-indicator";

type WebMcpBridgeProps = {
  sessionId: string;
  exposedTo?: string[];
};

function initialStatus(): WebMcpStatus {
  if (typeof window === "undefined") return "registering";
  const context = getModelContext();
  if (!context || !isSecureContextForWebMcp()) return "unavailable";
  return "registering";
}

export function WebMcpBridge({ sessionId, exposedTo }: WebMcpBridgeProps) {
  const [status, setStatus] = useState<WebMcpStatus>(initialStatus);

  useEffect(() => {
    const controller = new AbortController();
    const context = getModelContext();

    if (!context || !isSecureContextForWebMcp()) {
      return () => controller.abort();
    }

    const tools = createInheritTools(() => sessionId);
    registerTools(tools, { signal: controller.signal, exposedTo })
      .then((result) => {
        if (!controller.signal.aborted) {
          setStatus(result.supported ? "ready" : "unavailable");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => controller.abort();
  }, [sessionId, exposedTo]);

  return <WebMcpIndicator status={status} />;
}
