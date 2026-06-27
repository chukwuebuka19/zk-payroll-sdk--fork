/**
 * ZK Payroll SDK — Main entry point.
 *
 * Architecture layers:
 *   adapters/ — Low-level blockchain/Soroban wrappers
 *   crypto/   — ZK proof generation
 *   cache/    — Caching providers
 *   testing/  — Mock utilities
 */

// ── Adapters Layer ──────────────────────────────────────────────────────────
export { PayrollService } from "./payroll";
export { PayrollContract } from "./contract";
export { ZKProofGenerator } from "./crypto/proofs";
export { SnarkjsProofGenerator } from "./crypto/SnarkjsProofGenerator";
export { WorkerProofGenerator } from "./crypto/WorkerProofGenerator";
export type {
  WorkerLike,
  WorkerProofOptions,
  ProofProgressCallback,
} from "./crypto/WorkerProofGenerator";
export type { WorkerRequest, WorkerResponse, ProofProgressStage } from "./crypto/WorkerMessages";
export {
  ZkPayrollError,
  NetworkError,
  ProofGenerationError,
  ContractExecutionError,
  ValidationError,
  ContractErrorCode,
  mapRpcError,
  PayrollError,
} from "./errors";
export type { ErrorContext, ContractErrorCodeType } from "./errors";
export { DEFAULT_CONFIG } from "./config";
export * from "./cache";
export * from "./types";
export * from "./crypto/IProofGenerator";
export * from "./adapters";

// ── Testing Utilities ───────────────────────────────────────────────────────
export * from "./testing";
export { TransactionWatcher } from "./events";
export type { ConfirmationOptions, ConfirmationResult } from "./events";
