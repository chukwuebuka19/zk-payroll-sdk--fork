import { Keypair, Networks } from "@stellar/stellar-sdk";
import { PayrollContractWrapper } from "./adapters/PayrollContractWrapper";
import { IProofGenerator, ProofPayload } from "./crypto/IProofGenerator";
import { PayrollError, PayrollServiceErrorCode } from "./errors";
import { PaymentParams, PaymentResult } from "./types";
import { SdkLogger } from "./logging/SdkLogger";

export interface Transaction {
  amount: bigint;
  [key: string]: unknown;
}

export interface FilterCriteria {
  minAmount: bigint;
}

/**
 * PayrollService — API layer for private payroll payments.
 *
 * Orchestrates ZK proof generation and contract invocation through
 * injected dependencies (IProofGenerator and PayrollContractWrapper).
 *
 * Pass an SdkLogger to observe payment lifecycle events without patching internals.
 * Sensitive fields (recipient, amount, asset) are never written to the log.
 */
export class PayrollService {
  constructor(
    private readonly contractWrapper: PayrollContractWrapper,
    private readonly proofGenerator: IProofGenerator,
    private readonly signer: Keypair,
    private readonly network: string = Networks.TESTNET,
    private readonly logger?: SdkLogger
  ) {}

  /**
   * Process a private payment by generating a ZK proof and submitting
   * the transaction to the Soroban contract.
   */
  async processPayment(params: PaymentParams): Promise<PaymentResult> {
    const { recipient, amount, asset } = params;

    this.logger?.info("payment_start");

    // 1. Validate inputs
    try {
      this.validatePaymentParams(params);
    } catch (error) {
      this.logger?.warn("payment_validation_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    // 2. Generate ZK proof
    const witness: Record<string, unknown> = {
      recipient,
      amount: amount.toString(),
      asset,
    };

    let proof: ProofPayload;
    try {
      proof = await this.proofGenerator.generateProof(witness);
    } catch (error) {
      if (error instanceof PayrollError) {
        throw error;
      }
      throw new PayrollError(
        `Proof generation failed: ${error instanceof Error ? error.message : String(error)}`,
        PayrollServiceErrorCode.PROOF_GENERATION_FAILED
      );
    }

    // 3. Invoke contract
    this.logger?.info("contract_invocation_start", { method: "private_pay" });

    const resultXdr = await this.contractWrapper.privatePay(
      recipient,
      amount,
      asset,
      proof,
      this.signer,
      this.network
    );

    const result: PaymentResult = {
      txHash: resultXdr.toXDR("hex"),
      publicSignals: proof.publicSignals,
    };

    this.logger?.info("payment_complete", { txHash: result.txHash });

    return result;
  }

  filterTransactions(transactions: Transaction[], criteria: FilterCriteria): Transaction[] {
    return transactions.filter((t) => t.amount > criteria.minAmount);
  }

  private validatePaymentParams(params: PaymentParams): void {
    if (!params.recipient || params.recipient.trim() === "") {
      throw new PayrollError(
        "Recipient address is required",
        PayrollServiceErrorCode.INVALID_RECIPIENT
      );
    }
    if (params.amount <= 0n) {
      throw new PayrollError(
        "Amount must be a positive value",
        PayrollServiceErrorCode.INVALID_AMOUNT
      );
    }
    if (!params.asset || params.asset.trim() === "") {
      throw new PayrollError("Asset identifier is required", PayrollServiceErrorCode.INVALID_ASSET);
    }
  }
}
