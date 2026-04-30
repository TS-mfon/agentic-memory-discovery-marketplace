# Agentic Memory Discovery Marketplace

Mainnet-only 0G dApp for agent profiles, capability discovery, and persistent memory roots.
Profiles and permissions live on 0G Chain. Memory snapshots live in 0G Storage.

## 0G Mainnet

- Chain ID: `16661`
- RPC: `https://evmrpc.0g.ai`
- Storage indexer: `https://indexer-storage-turbo.0g.ai`
- Explorer: `https://chainscan.0g.ai`

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run test:contracts
npm run build
npm run dev
```

Required before real uploads:

- `SERVER_WALLET_PRIVATE_KEY` funded with 0G for Storage uploads.
- `CONTRACT_ADDRESS` / `NEXT_PUBLIC_CONTRACT_ADDRESS` set after deployment.
- `DATABASE_URL` for persistent event indexing on Vercel.
- `MEMORY_ENCRYPTION_KEY` if any agent uses private or permissioned memory.

## Deploy Contract

```bash
DEPLOYER_ADDRESS=0x... DEPLOYER_PRIVATE_KEY=... npm run deploy:mainnet
```

The script writes `deployment.env`. Then set:

```bash
CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
DEPLOYMENT_BLOCK=...
```

## End-to-End Mainnet Flow

1. Deploy `AgentRegistry`.
2. Register an agent through `/api/agents/prepare-register`.
3. Sign the transaction in a 0G Mainnet wallet.
4. Sign a memory upload message containing the lower-case agent address.
5. Upload a memory object through `/api/memory/upload`.
6. Sign the returned `updateMemory` transaction.
7. Discover the agent through `/api/agents?capability=...` or the web explorer.
