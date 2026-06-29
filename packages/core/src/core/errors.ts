export interface ErrorContext {
  transactionId?: string;
  contractId?: string;
  network?: string;
  [key: string]: unknown;
}

export class ZkPayrollError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: ErrorContext = {}
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NetworkError extends ZkPayrollError {
  constructor(
    message: string,
    code: string = "NETWORK_ERROR",
    context: ErrorContext = {},
    public readonly statusCode?: number
  ) {
    super(message, code, context);
  }
}

export class ProofGenerationError extends ZkPayrollError {
  constructor(
    message: string,
    code: string = "PROOF_GENERATION_FAILED",
    context: ErrorContext = {}
  ) {
    super(message, code, context);
  }
}

export const ContractErrorCode = {
  SIMULATION_FAILED: "SIMULATION_FAILED",
  TRANSACTION_SUBMISSION_FAILED: "TRANSACTION_SUBMISSION_FAILED",
  TRANSACTION_TIMEOUT: "TRANSACTION_TIMEOUT",
  INSUFFICIENT_FEE: "INSUFFICIENT_FEE",
  CONTRACT_REVERT: "CONTRACT_REVERT",
  UNKNOWN_RPC_ERROR: "UNKNOWN_RPC_ERROR",
} as const;

export type ContractErrorCodeType = (typeof ContractErrorCode)[keyof typeof ContractErrorCode];

export class ContractExecutionError extends ZkPayrollError {
  constructor(
    message: string,
    code: ContractErrorCodeType = ContractErrorCode.UNKNOWN_RPC_ERROR,
    context: ErrorContext = {}
  ) {
    super(message, code, context);
  }
}

export class ValidationError extends ZkPayrollError {
  constructor(
    message: string,
    public readonly field: string,
    code: string = "VALIDATION_ERROR",
    context: ErrorContext = {}
  ) {
    super(message, code, context);
  }
}

export function mapRpcError(error: unknown, context: ErrorContext = {}): ContractExecutionError {
  if (error instanceof ContractExecutionError) {
    return error;
  }

  const msg = error instanceof Error ? error.message : String(error);

  if (/simulate/i.test(msg)) {
    return new ContractExecutionError(
      `Simulation failed: ${msg}`,
      ContractErrorCode.SIMULATION_FAILED,
      context
    );
  }

  if (/fee|insufficient/i.test(msg)) {
    return new ContractExecutionError(
      `Insufficient fee: ${msg}`,
      ContractErrorCode.INSUFFICIENT_FEE,
      context
    );
  }

  if (/timeout|expired/i.test(msg)) {
    return new ContractExecutionError(
      `Transaction timed out: ${msg}`,
      ContractErrorCode.TRANSACTION_TIMEOUT,
      context
    );
  }

  if (/revert|trap|wasm/i.test(msg)) {
    return new ContractExecutionError(
      `Contract reverted: ${msg}`,
      ContractErrorCode.CONTRACT_REVERT,
      context
    );
  }

  if (/submit|send/i.test(msg)) {
    return new ContractExecutionError(
      `Transaction submission failed: ${msg}`,
      ContractErrorCode.TRANSACTION_SUBMISSION_FAILED,
      context
    );
  }

  return new ContractExecutionError(
    `Unknown RPC error: ${msg}`,
    ContractErrorCode.UNKNOWN_RPC_ERROR,
    context
  );
}
