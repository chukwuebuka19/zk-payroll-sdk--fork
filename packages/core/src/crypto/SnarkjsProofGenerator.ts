import { groth16 } from "snarkjs";
import axios from "axios";
import { CacheProvider } from "../cache/CacheProvider";
import { PayrollError } from "../errors";
import {
  IPreloadableProofGenerator,
  ProofPayload,
  ProofGeneratorConfig,
  PreloadStatus,
} from "./IProofGenerator";
import { SdkLogger } from "../logging/SdkLogger";

/**
 * Snarkjs-based implementation of IPreloadableProofGenerator.
 * Handles downloading circuit artifacts (.wasm, .zkey) and generating Groth16 proofs.
 *
 * Pass an SdkLogger to observe proof generation and artifact lifecycle events.
 * Sensitive data (witness fields, amounts, recipients) is never logged.
 */
export class SnarkjsProofGenerator implements IPreloadableProofGenerator {
  private wasmCache?: ArrayBuffer;
  private zkeyCache?: Uint8Array;
  private preloadStatus: PreloadStatus = { wasmLoaded: false, zkeyLoaded: false };

  constructor(
    private config: ProofGeneratorConfig,
    private cache?: CacheProvider<string>,
    private logger?: SdkLogger
  ) {}

  async generateProof(witness: Record<string, unknown>): Promise<ProofPayload> {
    this.logger?.info("proof_generation_start", { wasmUrl: this.config.wasmUrl });

    try {
      if (this.cache) {
        const cacheKey = this.witnessKey(witness);
        const cached = await this.cache.get(cacheKey);
        if (cached !== null) {
          this.logger?.info("proof_cache_hit");
          return JSON.parse(cached);
        }
        this.logger?.info("proof_cache_miss");
      }

      const [wasm, zkey] = await Promise.all([this.fetchWasm(), this.fetchZkey()]);

      const { proof, publicSignals } = await groth16.fullProve(witness, wasm, zkey);

      const payload = this.formatProofPayload(proof, publicSignals);

      if (this.cache) {
        const cacheKey = this.witnessKey(witness);
        const ttl = this.config.artifactCacheTTL;
        await this.cache.set(cacheKey, JSON.stringify(payload), ttl);
      }

      this.logger?.info("proof_generation_complete");
      return payload;
    } catch (error) {
      this.logger?.error("proof_generation_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new PayrollError(
        `Proof generation failed: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Preloads the .wasm and .zkey circuit artifacts into memory so that
   * the first generateProof() call incurs no download latency.
   *
   * Reuses artifacts already cached from a previous preload or generateProof() call.
   */
  async preload(): Promise<PreloadStatus> {
    this.logger?.info("artifact_preload_start", {
      wasmUrl: this.config.wasmUrl,
      zkeyUrl: this.config.zkeyUrl,
    });

    await Promise.all([this.fetchWasm(), this.fetchZkey()]);

    this.preloadStatus = {
      wasmLoaded: true,
      zkeyLoaded: true,
      completedAt: new Date().toISOString(),
    };

    this.logger?.info("artifact_preload_complete");
    return this.preloadStatus;
  }

  /** Returns the current preload status without triggering any downloads. */
  getPreloadStatus(): PreloadStatus {
    return { ...this.preloadStatus };
  }

  private async fetchWasm(): Promise<ArrayBuffer> {
    if (this.wasmCache) {
      return this.wasmCache;
    }

    this.logger?.info("artifact_fetch_start", { type: "wasm", url: this.config.wasmUrl });

    try {
      const response = await axios.get<ArrayBuffer>(this.config.wasmUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      this.wasmCache = response.data;
      this.preloadStatus = { ...this.preloadStatus, wasmLoaded: true };
      this.logger?.info("artifact_fetch_complete", { type: "wasm" });
      return this.wasmCache;
    } catch (error) {
      throw new PayrollError(
        `Failed to fetch .wasm file from ${this.config.wasmUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        500
      );
    }
  }

  private async fetchZkey(): Promise<Uint8Array> {
    if (this.zkeyCache) {
      return this.zkeyCache;
    }

    this.logger?.info("artifact_fetch_start", { type: "zkey", url: this.config.zkeyUrl });

    try {
      const response = await axios.get<ArrayBuffer>(this.config.zkeyUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
      });

      this.zkeyCache = new Uint8Array(response.data);
      this.preloadStatus = { ...this.preloadStatus, zkeyLoaded: true };
      this.logger?.info("artifact_fetch_complete", { type: "zkey" });
      return this.zkeyCache;
    } catch (error) {
      throw new PayrollError(
        `Failed to fetch .zkey file from ${this.config.zkeyUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        500
      );
    }
  }

  private formatProofPayload(
    proof: {
      pi_a: string[];
      pi_b: string[][];
      pi_c: string[];
      protocol?: string;
      curve?: string;
    },
    publicSignals: string[]
  ): ProofPayload {
    return {
      proof: {
        pi_a: [proof.pi_a[0], proof.pi_a[1]],
        pi_b: [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        pi_c: [proof.pi_c[0], proof.pi_c[1]],
        protocol: proof.protocol || "groth16",
        curve: proof.curve || "bn128",
      },
      publicSignals,
    };
  }

  private witnessKey(witness: Record<string, unknown>): string {
    return `proof:${JSON.stringify(witness, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )}`;
  }

  clearArtifactCache(): void {
    this.wasmCache = undefined;
    this.zkeyCache = undefined;
    this.preloadStatus = { wasmLoaded: false, zkeyLoaded: false };
  }
}
