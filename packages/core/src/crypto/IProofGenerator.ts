export interface IProofGenerator {
  generateProof(witness: Record<string, unknown>): Promise<ProofPayload>;
}

/** Status returned by preload() and getPreloadStatus(). */
export interface PreloadStatus {
  /** Whether the .wasm circuit file has been loaded into memory. */
  wasmLoaded: boolean;
  /** Whether the .zkey proving-key file has been loaded into memory. */
  zkeyLoaded: boolean;
  /** ISO timestamp of when preloading completed, if it has. */
  completedAt?: string;
}

/**
 * Extended interface for proof generators that support artifact preloading.
 * Preloading downloads and caches circuit artifacts before proof generation
 * is needed, eliminating first-run latency.
 */
export interface IPreloadableProofGenerator extends IProofGenerator {
  /**
   * Preloads circuit artifacts (.wasm and .zkey) into memory.
   * Subsequent calls to generateProof() reuse the cached artifacts.
   *
   * @returns Status indicating which artifacts were loaded.
   */
  preload(): Promise<PreloadStatus>;

  /** Returns the current preload status without triggering a download. */
  getPreloadStatus(): PreloadStatus;
}

/** Structured proof payload compatible with Solidity/Soroban verifiers. */
export interface ProofPayload {
  proof: {
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

/** Configuration for proof generation artifacts. */
export interface ProofGeneratorConfig {
  /** URL or path to the circuit .wasm file */
  wasmUrl: string;
  /** URL or path to the proving key .zkey file */
  zkeyUrl: string;
  /** Optional cache TTL in seconds for downloaded artifacts */
  artifactCacheTTL?: number;
}
