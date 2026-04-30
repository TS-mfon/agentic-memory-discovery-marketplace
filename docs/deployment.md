# Deployment

This project is mainnet-only for 0G Mainnet.

## Contract

```bash
npm run test:contracts
DEPLOYER_ADDRESS=0x... DEPLOYER_PRIVATE_KEY=... npm run deploy:mainnet
```

The script writes `deployment.env`. Configure the deployed address and block:

```bash
CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
DEPLOYMENT_BLOCK=<deployment block>
```

## Vercel

Deploy the project root to Vercel.

Required environment variables:

- `ZERO_G_RPC_URL=https://evmrpc.0g.ai`
- `ZERO_G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai`
- `ZERO_G_CHAIN_ID=16661`
- `CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `SERVER_WALLET_PRIVATE_KEY`
- `DATABASE_URL`
- `ADMIN_SECRET`
- `MEMORY_ENCRYPTION_KEY`

## Mainnet Smoke Test

1. `GET /api/health` returns chain ID `16661`.
2. Server signer balance is non-zero.
3. Register an agent and confirm `AgentRegistered` on ChainScan.
4. Upload memory and confirm 0G Storage returns a root hash.
5. Sign `updateMemory` and confirm `MemoryUpdated` on ChainScan.
6. Query `GET /api/agents?capability=Storage`.
