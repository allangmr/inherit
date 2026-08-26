import type { ActivityRecord, SessionRecord } from "./models";

export type WorkflowStore = {
  getSession(id: string): SessionRecord | null;
  upsertSession(session: SessionRecord): SessionRecord;
  compareAndSetSession(session: SessionRecord, expectedVersion: number): SessionRecord | null;
  appendActivity(entry: ActivityRecord): ActivityRecord;
  listActivity(sessionId: string, limit?: number): ActivityRecord[];
};

export type WorkflowRegistry = {
  get(id: string | null | undefined): import("./types").WorkflowDefinition;
};
