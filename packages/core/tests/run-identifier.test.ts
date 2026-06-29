import { RunIdentifier } from "../src/core/run-identifier";

describe("RunIdentifier", () => {
  it("should generate a valid run identifier", () => {
    const runId = RunIdentifier.generate();
    expect(runId).toBeDefined();
    expect(runId.startsWith("run_")).toBe(true);
    expect(runId.length).toBe(4 + 64); // 'run_' + 32 bytes in hex
  });

  it("should generate unique identifiers", () => {
    const runId1 = RunIdentifier.generate();
    const runId2 = RunIdentifier.generate();
    expect(runId1).not.toBe(runId2);
  });

  it("should validate a correctly formatted run identifier", () => {
    const runId = RunIdentifier.generate();
    expect(RunIdentifier.isValid(runId)).toBe(true);
  });

  it("should invalidate incorrectly formatted identifiers", () => {
    expect(RunIdentifier.isValid("run_123")).toBe(false);
    expect(RunIdentifier.isValid("run_")).toBe(false);
    expect(RunIdentifier.isValid("")).toBe(false);
    expect(RunIdentifier.isValid("123")).toBe(false);
    // 63 characters (one too short)
    expect(RunIdentifier.isValid("run_" + "a".repeat(63))).toBe(false);
    // 65 characters (one too long)
    expect(RunIdentifier.isValid("run_" + "a".repeat(65))).toBe(false);
    // Invalid characters
    expect(RunIdentifier.isValid("run_" + "z".repeat(64))).toBe(false);
  });
});
