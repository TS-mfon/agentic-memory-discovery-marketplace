# Memory0G

Memory0G is a 0G Mainnet agent memory registry where AI agents register searchable identities, store memory snapshots, and anchor verifiable memory roots onchain.

## Submission Summary

- **Project name:** Memory0G
- **One-sentence description:** Memory0G lets AI agents register identities, publish verifiable memory roots, and be discovered by capabilities on 0G Mainnet.
- **Live app:** https://memory0g.vercel.app
- **GitHub:** https://github.com/TS-mfon/agentic-memory-discovery-marketplace
- **0G Mainnet contract:** `0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2`
- **0G Explorer:** https://chainscan.0g.ai/address/0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2
- **Chain:** 0G Mainnet, chain ID `16661`

## Project Overview

AI agents lose context across sessions, tools, models, and frameworks. Memory0G gives each agent an onchain profile and a persistent memory pointer that can be verified by users, other agents, or external apps.

The product provides:

- Agent identity registration on 0G Chain.
- Capability-tag discovery for finding useful agents.
- Memory root anchoring through the `AgentRegistry` smart contract.
- 0G Storage uploads for JSON memory snapshots.
- Live dashboard and explorer views that read directly from 0G Mainnet.
- Access policy support for public, private, and permissioned memory modes.

## Problem Solved

Most AI agents are stateless or depend on centralized databases controlled by one app. That creates three problems:

- **No durable memory:** agents lose useful history when the app, model, or framework changes.
- **No proof:** users cannot verify what memory state an agent claims to use.
- **No interoperability:** external tools cannot discover agent capabilities or consume a common memory pointer.

Memory0G solves this by separating memory data and memory proof:

- Memory snapshots are uploaded to 0G Storage.
- The resulting root hash is anchored on 0G Chain.
- Agent identity, capabilities, and latest memory root are publicly queryable through the registry contract.

## System Architecture

```text
User / Agent Wallet
        |
        | registerAgent(), updateMemory(), grantMemoryAccess()
        v
0G Chain: AgentRegistry.sol
        |
        | emits AgentRegistered, MemoryUpdated, CapabilitiesUpdated
        v
Next.js dApp on Vercel
        |
        | live reads through ethers JsonRpcProvider
        v
0G Mainnet RPC

Memory upload flow:

Agent memory JSON
        |
        | @0gfoundation/0g-storage-ts-sdk
        v
0G Storage Indexer
        |
        | root hash
        v
AgentRegistry.updateMemory(rootHash)
```

### Core Components

- `contracts/src/AgentRegistry.sol`  
  Stores agent profiles, capability tags, access policy, and latest memory root hash.

- `components/RegisterAgentClient.tsx`  
  Browser wallet flow that calls `registerAgent` directly on 0G Mainnet.

- `components/UploadMemoryClient.tsx`  
  Browser-side memory upload flow using `@0gfoundation/0g-storage-ts-sdk`, then calls `updateMemory`.

- `components/MemoryLiveClient.tsx`  
  Live dashboard/explorer data layer. Reads `getAllAgents()` and `getAgentProfile()` from the deployed contract.

- `lib/live.ts`  
  Server-side live contract reader and event parser used by dashboard, explorer, and activity pages.

- `app/api/*`  
  Optional API helpers for transaction preparation, confirmation, event sync, health checks, and read-only integration.

## 0G Modules Used

### 0G Chain

0G Chain is used as the source of truth for:

- Agent registration.
- Agent ownership.
- Capability tags.
- Memory root hash updates.
- Access policy and permission grants.
- Verifiable activity events.

Contract:

```text
AgentRegistry: 0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2
Explorer: https://chainscan.0g.ai/address/0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2
```

Important events:

- `AgentRegistered(address agentAddress, string name, string[] capabilityTags, uint256 timestamp)`
- `MemoryUpdated(address agentAddress, bytes32 oldHash, bytes32 newHash, uint256 timestamp)`
- `CapabilitiesUpdated(address agentAddress, string[] newTags, uint256 timestamp)`
- `AccessGranted(address agentAddress, address grantee, uint256 expiresAt)`

### 0G Storage

0G Storage is used for the memory payload itself. The app serializes an agent memory snapshot to JSON, uploads it through the official storage SDK, and keeps the returned Merkle/root hash.

Package:

```bash
npm install @0gfoundation/0g-storage-ts-sdk
```

Storage indexer:

```text
https://indexer-storage-turbo.0g.ai
```

The registry does not store full memory data. It stores only the root hash so users can verify that a given memory payload matches the agent's onchain pointer.

### 0G Compute

The repository includes `@0gfoundation/0g-compute-ts-sdk` as a forward-compatible dependency for decentralized inference flows. The current deployed demo focuses on 0G Chain and 0G Storage, while the intended extension is retrieval plus inference over verified memory roots.

## Smart Contract Design

`AgentRegistry` provides:

- `registerAgent(name, capabilityTags, capabilityMetadata, accessPolicy)`
- `updateMemory(newMemoryRootHash)`
- `updateCapabilities(newTags, newMetadata)`
- `setAccessPolicy(newPolicy)`
- `grantMemoryAccess(grantee, durationSeconds)`
- `revokeMemoryAccess(grantee)`
- `getAgentsByCapability(tag)`
- `getAllAgents()`
- `getAgentProfile(agentAddress)`
- `canReadMemory(reader, agentAddress)`
- `getMemoryRootHash(agentAddress)`

Security and validation:

- Only the registering wallet owns its agent profile.
- Only the owner can update memory, capabilities, and access policy.
- Empty names, empty metadata, empty tags, and oversized tags are rejected.
- Zero memory roots are rejected.
- Private and permissioned reads are controlled by `canReadMemory`.

## End-to-End 0G Flow

### 1. Register

The agent connects an EVM wallet on 0G Mainnet and calls:

```solidity
registerAgent(name, capabilityTags, capabilityMetadata, accessPolicy)
```

This emits `AgentRegistered` and makes the agent discoverable.

### 2. Store

The agent creates a memory object:

```json
{
  "version": "1.0",
  "agentAddress": "0x...",
  "timestamp": 1777833106,
  "snapshotId": "uuid",
  "context": {
    "conversationHistory": [],
    "taskLogs": [],
    "learnedPreferences": {}
  },
  "embeddings": {
    "memoryVectors": [],
    "embeddingModel": ""
  },
  "metadata": {
    "source": "web"
  },
  "previousRootHash": "0x..."
}
```

The dApp uploads that JSON to 0G Storage and receives a root hash.

### 3. Register Memory Root

The agent signs:

```solidity
updateMemory(rootHash)
```

This emits `MemoryUpdated`, proving the latest memory pointer on 0G Chain.

### 4. Retrieve / Verify

External apps can:

- Read `getAgentProfile(agentAddress)`.
- Fetch the memory root.
- Retrieve the payload from 0G Storage.
- Compare the payload's root against the onchain root.

## Backend API Documentation

The primary production flows use browser wallet transactions. The API routes are retained for integrations, automated agents, and reviewer testing.

### `GET /api/health`

Checks 0G RPC, latest block, configured contract, storage indexer, and signer status.

### `GET /api/agents`

Returns all live agents from the 0G Mainnet registry.

Query:

- `capability`: optional exact capability tag filter.

Example:

```bash
curl https://memory0g.vercel.app/api/agents
curl https://memory0g.vercel.app/api/agents?capability=Storage
```

### `GET /api/agents/:address`

Returns a single agent profile from the contract.

### `POST /api/agents/prepare-register`

Builds unsigned calldata for `registerAgent`.

Body:

```json
{
  "name": "Mainnet Memory Scout",
  "capabilityTags": ["0G", "Storage", "Discovery"],
  "capabilityMetadata": "{\"description\":\"Autonomous 0G memory registry demo agent\"}",
  "accessPolicy": 0
}
```

### `POST /api/agents/confirm`

Confirms a registration transaction and parses `AgentRegistered`.

Body:

```json
{ "txHash": "0x..." }
```

### `POST /api/memory/upload`

Uploads memory JSON to 0G Storage using the server adapter and returns calldata for `updateMemory`.

Body:

```json
{
  "agentAddress": "0x...",
  "message": "0G memory upload authorization agent:0x... ts:...",
  "signature": "0x...",
  "memory": {
    "version": "1.0",
    "agentAddress": "0x...",
    "timestamp": 1777833106,
    "snapshotId": "demo-1",
    "context": {
      "conversationHistory": [],
      "taskLogs": [],
      "learnedPreferences": {}
    },
    "embeddings": {
      "memoryVectors": [],
      "embeddingModel": ""
    },
    "metadata": {},
    "previousRootHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
  }
}
```

### `GET /api/memory/:agentAddress`

Checks whether a reader can access an agent memory root.

Query:

- `reader`: optional wallet address.

### `POST /api/access/prepare-grant`

Builds unsigned calldata for permissioned memory access.

### `POST /api/sync`

Indexes registry events into the optional database. Protected by `x-admin-secret` when `ADMIN_SECRET` is configured.

## Local Deployment and Reproduction

### Prerequisites

- Node.js 22+
- npm
- Foundry for Solidity tests/deploys
- EVM wallet funded with 0G Mainnet gas

### Install

```bash
npm install
cp .env.example .env.local
```

### Configure

```bash
ZERO_G_RPC_URL=https://evmrpc.0g.ai
ZERO_G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai
ZERO_G_CHAIN_ID=16661
ZERO_G_EXPLORER=https://chainscan.0g.ai

NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16661
NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai

CONTRACT_ADDRESS=0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2
NEXT_PUBLIC_CONTRACT_ADDRESS=0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2
DEPLOYMENT_BLOCK=31949816
```

Optional:

```bash
DATABASE_URL=postgres://...
SERVER_WALLET_PRIVATE_KEY=0x...
ADMIN_SECRET=...
MEMORY_ENCRYPTION_KEY=...
```

### Test and Build

```bash
npm run typecheck
npm run test:contracts
npm run build
```

### Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Deploy a New Contract

```bash
DEPLOYER_ADDRESS=0x... DEPLOYER_PRIVATE_KEY=0x... npm run deploy:mainnet
```

The deploy script writes `deployment.env` with:

- `CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `DEPLOYMENT_BLOCK`

## Reviewer Notes

- This is a mainnet-only deployment. The app expects 0G Mainnet chain ID `16661`.
- Reviewers need a 0G-compatible EVM wallet to register or update memory.
- Existing live data is visible without a wallet through the dashboard and explorer.
- The app intentionally stores only hashes onchain; full memory payloads are stored through 0G Storage.
- The short public demo URL is `https://memory0g.vercel.app`.

## Test Account Details

No custodial test account is required. Reviewers can inspect live agents without connecting a wallet.

Known live registered agents:

- `0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E`
- `0xEd9EDd8586b20524CafA4F568413C504C9B03172`

To perform write operations, use any wallet funded with 0G Mainnet gas.

## User Testing Notes

Manual user testing covered:

- Landing page readability and navigation.
- Dashboard live agent loading.
- Agent explorer with long wallet addresses and root hashes.
- Agent registration form validation.
- Memory upload empty-state generation.
- Contract activity readability.
- Browser icon rendering.
- Vercel production deployment.
- Public alias availability at `memory0g.vercel.app`.

Observed issue fixed:

- Ethers decoded return arrays were converted to plain arrays/objects to prevent the dashboard runtime error: `Cannot assign to read only property '0'`.

## Technical Write-Up: How 0G Integration Works

Memory0G uses 0G Chain and 0G Storage together:

1. The wallet signs a transaction to `AgentRegistry.registerAgent`.
2. The registry stores the agent identity, capability tags, and access mode.
3. A memory snapshot is serialized as JSON.
4. The snapshot is uploaded through `@0gfoundation/0g-storage-ts-sdk`.
5. The returned storage root is submitted to `AgentRegistry.updateMemory`.
6. The registry emits `MemoryUpdated`, giving users a permanent onchain audit trail.
7. The dashboard and explorer read the registry directly from 0G Mainnet RPC.

This design keeps bulky memory data offchain in 0G Storage while preserving a compact, verifiable proof pointer on 0G Chain.

## Judging Criteria Alignment

- **0G Technical Integration Depth & Innovation:** combines agent identity, capability discovery, 0G Storage roots, and 0G Chain verification.
- **Technical Implementation & Completeness:** includes Solidity contract, Next.js app, live reads, wallet writes, API helpers, deployment scripts, and tests.
- **Product Value & Market Potential:** targets persistent memory infrastructure for autonomous agents and agent marketplaces.
- **User Experience & Demo Quality:** modern white/purple interface with dashboard, explorer, registration, memory upload, and activity pages.
- **Team Capability & Documentation:** includes contract architecture, reproduction steps, API docs, testing notes, and deployed mainnet proof.

## Important Links

- Live app: https://memory0g.vercel.app
- Dashboard: https://memory0g.vercel.app/dashboard
- Explorer: https://memory0g.vercel.app/explorer
- Contract: `0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2`
- 0G Explorer: https://chainscan.0g.ai/address/0x73784e99C0E183499Da4D3E8002CBd6fdadC36B2
- Repository: https://github.com/TS-mfon/agentic-memory-discovery-marketplace
