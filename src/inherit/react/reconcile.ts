export type PollableWorkflowState = {
  session: {
    id: string;
    version: number;
    status: string;
    values: Record<string, string | boolean | undefined>;
    bookingId?: string | null;
  };
  booking?: { id: string } | null;
};

function hasSettledRecord(state: PollableWorkflowState) {
  const status = state.session.status;
  return (
    status === "booked" ||
    status === "submitted" ||
    status === "cancelled" ||
    Boolean(state.session.bookingId || state.booking?.id)
  );
}

function isRegressivePoll(current: PollableWorkflowState, incoming: PollableWorkflowState) {
  if (incoming.session.id !== current.session.id) return true;
  const currentSettled = hasSettledRecord(current);
  const incomingSettled = hasSettledRecord(incoming);
  return currentSettled && !incomingSettled && incoming.session.status === "in_progress";
}

function keepLocalEdits(
  current: Record<string, string | boolean | undefined>,
  incoming: Record<string, string | boolean | undefined>,
) {
  const merged = { ...incoming };
  for (const [key, value] of Object.entries(current)) {
    if (value === undefined) continue;
    if (!(key in incoming)) {
      merged[key] = value;
      continue;
    }
    const remote = incoming[key];
    if (typeof value === "string" && typeof remote === "string" && value.startsWith(remote) && value !== remote) {
      merged[key] = value;
    }
  }
  return merged;
}

export function reconcilePolledState<T extends PollableWorkflowState>(
  current: T | null,
  incoming: T,
): T {
  if (!current) return incoming;
  if (isRegressivePoll(current, incoming)) return current;
  if (incoming.session.version <= current.session.version) return current;
  return {
    ...incoming,
    session: {
      ...incoming.session,
      values: keepLocalEdits(current.session.values, incoming.session.values),
    },
  };
}
