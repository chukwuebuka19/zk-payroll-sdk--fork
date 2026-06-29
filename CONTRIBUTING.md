# Contributing to ZK Payroll SDK

Thank you for your interest in contributing! This project is part of the **Stellar Wave Program**.

## Getting Started

```bash
git clone https://github.com/your-org/zk-payroll-sdk.git
cd zk-payroll-sdk
npm install
npm test
```

## Development

```bash
npm run build        # Build
npm test             # Run tests
npm run lint         # Lint
npm run typecheck    # Type check
npm run format       # Format code
```

### Snapshot Tests

The SDK uses Jest snapshot tests to lock down serialized proof request payloads.
Snapshots are stored in `tests/__snapshots__/` alongside the corresponding test file.

**Updating snapshots** after an intentional serialization change:

```bash
npx jest --updateSnapshot
# or
npx jest -u
```

Commit the updated `.snap` file together with the code change. When reviewing
snapshot diffs, verify that field ordering, type mappings, and hex-encoded XDR
lengths are consistent with the contract ABI expectations. See the header
comments in `tests/proof-request-snapshots.test.ts` for detailed guidance.

## Architecture

The SDK follows a **layered architecture** to maintain clean separation of concerns:

```
src/
├── api/            # API Layer — public-facing classes & interfaces
├── core/           # Core Layer — business logic (ZK proofs, caching, errors)
├── adapters/       # Adapters Layer — low-level Soroban/blockchain wrappers
├── testing/        # Testing utilities (mocks, helpers)
└── index.ts        # Barrel re-export from all layers
```

### API Layer (`src/api/`)

The **public interface** of the SDK. This is what consumers import and use directly.

- `PayrollService` — main entry point for payroll operations
- `PayrollContract` — contract interaction facade
- `DEFAULT_CONFIG` — default SDK configuration
- Types: `PayrollRecord`, `Network`, `ClientConfig`

**Rules:**
- Only expose what consumers need. Keep implementation details private.
- Classes here orchestrate calls to Core and Adapters layers.
- Never import directly from Adapters — go through Core interfaces.

### Core Layer (`src/core/`)

**Business logic** that is independent of any specific blockchain or external service.

- `IProofGenerator` — interface for ZK proof generation strategies
- `SnarkjsProofGenerator` — snarkjs Groth16 proof implementation
- `ZKProofGenerator` — legacy proof generator (deprecated)
- `PayrollError` — base error class
- Cache providers (`MemoryCacheProvider`, `LocalStorageCacheProvider`)

**Rules:**
- Define **interfaces** that Adapters implement (e.g., `IProofGenerator`).
- No direct dependencies on `@stellar/stellar-sdk` or other blockchain libraries.
- Pure business logic and domain types only.

### Adapters Layer (`src/adapters/`)

**Low-level wrappers** for external systems (Soroban RPC, blockchain, etc.).

- `BaseContractWrapper` — abstract Soroban contract call pipeline
- Concrete wrappers extend `BaseContractWrapper` for specific contracts

**Rules:**
- Only this layer may depend on `@stellar/stellar-sdk` and RPC libraries.
- Implement interfaces defined in Core.
- Handle all serialization (XDR encoding, etc.) here.

### Dependency Flow

```
API → Core → (interfaces only)
API → Adapters (via dependency injection)
Adapters → Core (implements Core interfaces)
```

**Never:** `Core → Adapters` or `Core → API`

## Adding New Features

1. **Define the interface** in Core (`src/core/` or `src/crypto/`)
2. **Implement the adapter** in Adapters (`src/adapters/`)
3. **Expose the API** in API layer (`src/api/`)
4. **Export** from the layer's `index.ts` barrel file
5. **Write tests** in `tests/`

## Barrel Files

Each layer has an `index.ts` that explicitly controls what is exported:

- `src/api/index.ts` — public API exports
- `src/core/index.ts` — core logic exports
- `src/adapters/index.ts` — adapter exports
- `src/index.ts` — re-exports from all layers

When adding new modules, always add them to the appropriate barrel file.

## Areas of Contribution

- **Core SDK** — Client methods, contract interactions
- **Crypto** — Poseidon, Groth16, proof generation
- **Types** — TypeScript definitions
- **Tests** — Unit and integration tests
- **Documentation** — API docs, examples

## Issue Labels

| Label | Points |
|-------|--------|
| `good-first-issue` | 100 |
| `medium` | 150 |
| `high` | 200 |

## Code of Conduct

Be respectful. Quality over quantity.

## License

MIT
