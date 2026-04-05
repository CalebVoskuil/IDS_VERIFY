# Vero — Blockchain-Based Digital Student Identity & Payment System

Vero is a prototype platform that issues, holds, and verifies digital student credentials using self-sovereign identity (SSI) principles. Built for UCT (University of Cape Town), it demonstrates a canteen-style flow where a student receives a verifiable credential on their phone and presents it at a point-of-service terminal to prove enrollment and authorise payment — without revealing unnecessary personal data.

The system consists of three independent services: an **issuer agent** (the university), a **verifier agent** (the canteen terminal), and a **mobile wallet** (the student's phone). All three communicate using DIDComm and verify credentials against the BCovrin Hyperledger Indy test ledger.

## Architecture Overview

```
┌──────────────────┐     DIDComm / HTTP      ┌──────────────────┐
│   Issuer Agent   │◄───────────────────────►│   Mobile Wallet  │
│  (University)    │   credential issuance    │   (Student)      │
│  Fastify API     │                          │  React Native    │
│  Port 3000       │                          │  Credo.js + Askar│
└──────────────────┘                          └────────┬─────────┘
                                                       │
                                              QR scan / DIDComm
                                                       │
                                              ┌────────▼─────────┐
                                              │  Verifier Agent  │
                                              │  (Canteen)       │
                                              │  Fastify API     │
                                              │  Port 3100       │
                                              └──────────────────┘
                                                       │
                              All three agents          │
                              resolve DIDs,      ┌──────▼──────┐
                              schemas, and       │   BCovrin    │
                              cred defs from ──► │  Test Ledger │
                              the ledger         └─────────────┘
```

## Project Structure

```
vero/
├── packages/
│   ├── issuer-agent/          # University credential issuer (Node.js)
│   │   ├── src/
│   │   │   ├── agent.ts           # Credo.js agent factory (Askar, AnonCreds, DIDComm, IndyVDR)
│   │   │   ├── bootstrap.ts       # DID registration on BCovrin via HTTP
│   │   │   ├── config.ts          # Environment-driven configuration
│   │   │   ├── phase2.ts          # Idempotent schema + credential definition registration
│   │   │   ├── issue-credential.ts # OOB credential offer creation + QR generation
│   │   │   ├── server.ts          # Fastify REST API (POST /issue-credential, GET /oob/:id)
│   │   │   └── index.ts           # Entrypoint — boots agent, registers artifacts, starts API
│   │   └── test/                  # Jest unit tests (Zod schemas, config, artifacts)
│   │
│   ├── verifier-agent/        # Canteen proof verifier (Node.js)
│   │   ├── src/
│   │   │   ├── agent.ts           # Independent Credo.js agent (does not share state with issuer)
│   │   │   ├── bootstrap.ts       # Genesis fetch + DID helpers
│   │   │   ├── config.ts          # Environment-driven configuration
│   │   │   ├── proof-request.ts   # Canteen proof request creation + verification logic
│   │   │   ├── server.ts          # Fastify REST API (POST /generate-qr, POST /verify-proof)
│   │   │   └── index.ts           # Entrypoint — boots agent, starts API
│   │   └── test/                  # Jest unit tests (Zod schemas, proof evaluation, config)
│   │
│   ├── wallet/                # Student mobile wallet (React Native, Android-first)
│   │   ├── src/
│   │   │   ├── agent/
│   │   │   │   ├── config.ts          # Wallet agent config (BCovrin genesis URL, Askar paths)
│   │   │   │   └── createWalletAgent.ts # Full Credo.js mobile agent (Askar, AnonCreds, DIDComm, IndyVDR)
│   │   │   ├── context/
│   │   │   │   ├── AgentContext.tsx    # React Context for agent instance + connection status
│   │   │   │   └── CredentialContext.tsx # React Context for credentials, balance, transactions
│   │   │   ├── navigation/
│   │   │   │   └── AppNavigator.tsx   # Bottom tab navigator (Home, Scan, Approval, Wallet)
│   │   │   ├── screens/
│   │   │   │   ├── HomeScreen.tsx     # Credential status display
│   │   │   │   ├── ScanScreen.tsx     # QR code scanner (camera placeholder)
│   │   │   │   ├── ApprovalScreen.tsx # Proof request approval (Approve/Deny)
│   │   │   │   └── WalletScreen.tsx   # Balance, top-up, transaction history
│   │   │   └── App.tsx               # Root component with providers + navigator
│   │   ├── android/                   # Gradle build config, native project
│   │   ├── __mocks__/                 # Jest mocks for native modules
│   │   └── test/                      # Unit + snapshot tests
│   │
│   ├── admin-portal/          # (Placeholder — not yet implemented)
│   └── shared/                # (Placeholder — shared types for cross-agent use)
│
├── tests/
│   └── e2e/
│       └── src/
│           └── canteen-flow.test.ts  # Full integration test: issuer + verifier in-process
│
├── vendor/
│   └── npm/                   # Patched native dependency (@2060.io/ffi-napi)
│
├── package.json               # Root — npm workspaces config
├── tsconfig.base.json         # Shared TypeScript settings (ES2022, strict)
└── .gitignore
```

## Technology Stack

### Monorepo & Language
| Technology | Purpose |
|---|---|
| **npm workspaces** | Manages multiple packages in one repo with shared dependency resolution |
| **TypeScript** | Static typing across all packages |
| **tsx** | Runs TypeScript directly in Node.js for backend dev (`npm start`) |

### Backend Framework
| Technology | Purpose |
|---|---|
| **Fastify** | HTTP framework for the issuer and verifier REST APIs. Chosen over Express for first-class TypeScript support and schema-based validation |
| **Zod** | Runtime request body validation for all API endpoints |

### Self-Sovereign Identity (SSI)
| Technology | Purpose |
|---|---|
| **Credo.js (`@credo-ts/*`)** | Core SSI framework. Manages agent lifecycle, DID operations, credential issuance, proof verification, and DIDComm messaging |
| `@credo-ts/core` | Agent class, DID management, logging |
| `@credo-ts/node` | Node.js-specific dependencies and HTTP transports |
| `@credo-ts/react-native` | React Native-specific dependencies |
| `@credo-ts/anoncreds` | AnonCreds credential format support |
| `@credo-ts/askar` | Wallet storage integration with Aries Askar |
| `@credo-ts/didcomm` | DIDComm v2 protocols for credential exchange and proof exchange |
| `@credo-ts/indy-vdr` | Hyperledger Indy ledger read/write operations |
| **AnonCreds** | Credential format supporting selective disclosure and zero-knowledge proofs — a student can prove enrollment status without revealing their full name |
| **DIDComm** | Encrypted peer-to-peer messaging protocol between agents (issuer-to-wallet, wallet-to-verifier) |

### Distributed Ledger
| Technology | Purpose |
|---|---|
| **Hyperledger Indy** | Purpose-built blockchain for decentralized identity. Stores DIDs, schemas, and credential definitions publicly |
| **BCovrin Test Network** | Free public Indy test ledger (`http://test.bcovrin.vonx.io/genesis`) used during development |
| **IndyVDR** | Client library that reads/writes to the Indy ledger (resolve DIDs, fetch schemas, submit transactions). Node.js and React Native variants |

### Wallet & Secure Storage
| Technology | Purpose |
|---|---|
| **Aries Askar** | Encrypted SQLite database for private keys, credentials, and agent state. Node.js and React Native variants. Replaces the older indy-sdk wallet |

### Mobile
| Technology | Purpose |
|---|---|
| **React Native (bare workflow)** | Cross-platform mobile framework. Bare workflow required because Hyperledger native libraries need direct access to `build.gradle` |
| **React Navigation** | Tab-based routing: Home, Scan, Approval, Wallet screens |
| **React Context** | Global state: `AgentContext` (agent instance/status) and `CredentialContext` (credentials, balance, proof requests) |
| **react-native-vision-camera** | Camera library for QR code scanning |
| **react-native-fs** | File system access for resolving the Askar SQLite database path |
| **react-native-get-random-values** | Polyfill for `crypto.getRandomValues()` required by Credo.js |
| **Metro** | React Native's JS bundler, configured for monorepo resolution |
| **Hermes** | Optimised JS engine for React Native (enabled in Gradle config) |

### QR Codes
| Technology | Purpose |
|---|---|
| **qrcode** | Generates QR codes as base64 PNG data URLs. Used by issuer (credential offers) and verifier (proof requests) |

### Testing
| Technology | Purpose |
|---|---|
| **Jest** | Test runner for unit tests (Zod schemas, config, utilities) and React Native snapshot tests |
| **react-test-renderer** | Renders React Native components to JSON for snapshot testing without a device |
| **Node.js test runner (`node:test`)** | Used for the e2e integration test — avoids Jest ESM module linking issues with Credo.js dynamic imports |

## Credential Schema

The student credential (`Vero UCT Student Credential v1.0.0`) has these attributes:

| Attribute | Example |
|---|---|
| `studentNumber` | `20260042` |
| `fullName` | `Thabo Mokoena` |
| `faculty` | `Engineering & the Built Environment` |
| `enrollmentStatus` | `active` |
| `validFrom` | `2026-01-15` |
| `validUntil` | `2026-12-15` |

The verifier's canteen proof request asks for `studentNumber`, `enrollmentStatus`, `validFrom`, and `validUntil`, with business rules requiring `enrollmentStatus == "active"` and the credential to be within its validity period.

## End-to-End Flow

1. **Issuer boots** — connects to BCovrin, registers a DID, publishes the schema and credential definition
2. **Student requests credential** — `POST /issue-credential` with student data returns a QR code encoding a DIDComm out-of-band invitation
3. **Wallet scans QR** — the mobile wallet receives the credential offer via DIDComm, auto-accepts, and stores the credential in Askar
4. **Verifier generates proof QR** — `POST /generate-qr` creates a proof request QR displayed at the canteen terminal
5. **Wallet scans proof QR** — receives the proof request, displays the Approval screen showing what data is requested
6. **Student approves** — wallet constructs and sends a proof presentation via DIDComm
7. **Verifier checks proof** — `POST /verify-proof` resolves the proof exchange, validates against BCovrin, applies business rules, returns `approved`/`rejected`/`pending`

## Running the Project

### Prerequisites
- Node.js 20+
- npm 10+
- Android Studio with SDK Platform API 36, NDK 27.1, and an AVD (for the wallet)

### Install dependencies
```bash
npm install
```

### Start the issuer agent
```bash
npm start --workspace=@vero/issuer-agent
```
Boots on port 3000 by default. Registers a DID + schema + cred def on BCovrin on first run.

### Start the verifier agent
```bash
npm start --workspace=@vero/verifier-agent
```
Boots on port 3100 by default.

### Run unit tests
```bash
npm test --workspace=@vero/issuer-agent
npm test --workspace=@vero/verifier-agent
npm test --workspace=@vero/wallet
```

### Run e2e integration test
```bash
npm test --workspace=@vero/e2e-tests
```
Boots both agents in-process against the live BCovrin testnet and validates the full issuance + proof-request flow.

### Build and run the wallet (Android)
```bash
cd packages/wallet
npx react-native run-android
```
Requires `ANDROID_HOME` and `JAVA_HOME` environment variables and a running emulator or connected device.

## Current Status

| Component | Status |
|---|---|
| Issuer Agent | Fully functional — DID registration, schema/cred-def, REST API, credential issuance |
| Verifier Agent | Fully functional — proof request generation, QR codes, proof verification |
| E2E Test | Passing — full canteen flow verified against BCovrin |
| Mobile Wallet | Code complete (agent + 4 UI screens) — pending first Android build verification |
| Admin Portal | Scaffold only — not yet implemented |

## Key Design Decisions

- **Askar over indy-sdk**: Askar is the modern replacement with better performance and active maintenance. All wallet storage uses Askar SQLite.
- **AnonCreds over W3C VCs**: AnonCreds supports selective disclosure natively — critical for proving enrollment without revealing full identity.
- **Bare React Native over Expo**: The Hyperledger native libraries (Askar, AnonCreds, IndyVDR) require native linking and `build.gradle` modifications that Expo managed workflow cannot support.
- **Separate agent instances**: The issuer and verifier never share wallet state or agent instances — this mirrors a real deployment where they are separate organisations.
- **Idempotent artifact registration**: Schema and credential definition registration checks BCovrin first and reuses existing IDs, so restarting the issuer doesn't create duplicates.
- **DIDComm v2**: All credential exchange and proof presentation uses DIDComm v2 protocols via `@credo-ts/didcomm`.
- **Environment-driven config**: All agent configuration (ports, DID seeds, ledger URLs, wallet paths) is resolved from environment variables with sensible defaults for local development.
