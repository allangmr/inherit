export class StaleSessionError extends Error {
  readonly expected: number;
  readonly actual: number;

  constructor(expected: number, actual: number) {
    super(`Session was updated (version ${actual}). Reload and retry.`);
    this.name = "StaleSessionError";
    this.expected = expected;
    this.actual = actual;
  }
}
