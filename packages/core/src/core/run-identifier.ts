import { randomBytes } from "crypto";

export class RunIdentifier {
  /**
   * Generates a new cryptographically random run identifier.
   * Format: `run_<32-byte hex string>`
   *
   * @returns A string representing the generated run identifier.
   */
  static generate(): string {
    const hex = randomBytes(32).toString("hex");
    return `run_${hex}`;
  }

  /**
   * Validates if a given string is a valid run identifier.
   * A valid run identifier is a 64-character hex string prefixed with 'run_'.
   *
   * @param runId - The string to validate.
   * @returns True if the string is a valid run identifier, false otherwise.
   */
  static isValid(runId: string): boolean {
    return /^run_[a-fA-F0-9]{64}$/.test(runId);
  }
}
