export type JsonSchema = {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: Array<string | number | boolean>;
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
};

export type ModelContextTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  execute: (
    args: Record<string, unknown> | string,
    extras?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
};

export type RegisteredTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema | string;
  origin?: string;
  title?: string;
  annotations?: ModelContextTool["annotations"];
};

export type ModelContext = {
  registerTool: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void>;
  getTools?: (options?: { fromOrigins?: string[] }) => Promise<RegisteredTool[]>;
  executeTool?: (
    tool: RegisteredTool | string,
    input: string,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
  addEventListener?: (type: "toolchange", listener: EventListener) => void;
};

/** Chrome 146–149 consumer surface, gated by #enable-webmcp-testing. */
export type ModelContextTesting = {
  listTools?: () => Promise<RegisteredTool[]>;
  getTools?: () => Promise<RegisteredTool[]>;
  executeTool?: (
    nameOrTool: string | RegisteredTool,
    input: string,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }

  interface Navigator {
    /** @deprecated Chrome 150. Use document.modelContext. Kept for ChatGPT in-app browser / Chrome 149. */
    modelContext?: ModelContext;
    modelContextTesting?: ModelContextTesting;
  }
}

export {};
