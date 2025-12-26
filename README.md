# Authorization-Governed Vault System

## 1. Project Overview
This project implements a secure, decentralized vault architecture that strictly separates **Asset Custody** (SecureVault) from **Permission Validation** (AuthorizationManager). 

The system enforces that funds can only be withdrawn when a valid **EIP-712** signature, generated off-chain by the owner, is presented. This design mimics production-grade Multi-Party Computation (MPC) or centralized-authority setups common in institutional DeFi.

## 2. Architecture & Design

### Components
1.  **AuthorizationManager (The Policy Engine)**
    * Responsible for cryptographic verification.
    * Stateless logic for signature recovery using `ECDSA` and `EIP-712`.
    * Stateful logic for **Replay Protection** (tracking used nonces/hashes).
    * Does *not* hold funds.

2.  **SecureVault (The Custodian)**
    * Holds ETH assets.
    * Contains zero cryptographic logic (Separation of Concerns).
    * Queries `AuthorizationManager` to approve withdrawals.
    * Follows the **Checks-Effects-Interactions** pattern to prevent reentrancy.

### Security Mechanisms

#### A. Replay Protection
We do not use a simple incrementing nonce per user. Instead, we hash the entire authorization payload:
`hash = keccak256(vault, recipient, amount, nonce, deadline)`

This hash is marked as `true` in a mapping `isAuthUsed[hash]` inside `AuthorizationManager` immediately upon verification. This guarantees that a signature can be used **exactly once**.

#### B. Domain Binding (Anti-Phishing)
The EIP-712 implementation binds the signature to:
* **Chain ID:** Prevents a testnet signature from being used on mainnet.
* **Verifying Contract:** Prevents a signature for "Vault A" from being used on "Vault B".

#### C. Expiry
Every authorization includes a `deadline`. If the transaction is mined after this timestamp, the `AuthorizationManager` reverts with `DeadlineExpired()`.

## 3. Setup & Deployment

### Prerequisites
* Docker & Docker Compose
* Node.js (for local testing without Docker)

### Running with Docker (Preferred)
This command will spin up a local blockchain, deploy contracts, and expose the RPC.

```bash
docker-compose up --build
```

