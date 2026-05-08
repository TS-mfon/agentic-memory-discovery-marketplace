# GuardianMesh Deployment

## Contracts

```bash
npm run test:contracts
DEPLOYER_PRIVATE_KEY=0x... npm run deploy:mainnet
```

The script deploys:

- `GuardianRegistry`
- `ProtectionReceipt`

It writes public deployment output to `deployment.env`. Copy the `NEXT_PUBLIC_*` values into Vercel.

## Vercel

Required public environment variables:

```text
NEXT_PUBLIC_0G_CHAIN_ID=16661
NEXT_PUBLIC_0G_CHAIN_ID_HEX=0x4115
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai
NEXT_PUBLIC_0G_STORAGE_SCAN=https://storagescan.0g.ai
NEXT_PUBLIC_GUARDIAN_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PROTECTION_RECEIPT_ADDRESS=0x...
NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_DA_GATEWAY_URL=
```

Do not expose deployer keys, GitHub tokens, Vercel tokens, or 0G Compute secret keys through `NEXT_PUBLIC_*`.

## DA

If no browser-accessible DA gateway exists, submit the review evidence file through:

```bash
npm run da:submit -- ./review-evidence.json
```

For final judging, submit the same payload through a live 0G DA client and anchor the returned commitment.
