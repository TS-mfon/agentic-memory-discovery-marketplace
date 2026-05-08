# GuardianMesh

GuardianMesh lets users create AI guard agents that privately review transactions, store audit memory on 0G, and anchor verifiable protection receipts on-chain.

## Overview

GuardianMesh is a no-backend agentic firewall for Web3 transactions. A user connects a wallet, creates a guardian agent, asks 0G Compute to review a transaction intent, uploads the full evidence bundle to 0G Storage, commits compact evidence to 0G DA, and records a receipt on 0G Chain.

The project targets Track 1, Track 3, and Track 5 by combining agent orchestration, autonomous app UX, privacy-preserving evidence, and verifiable infrastructure.

## 0G Modules Used

- **0G Chain:** `GuardianRegistry` and `ProtectionReceipt` contracts anchor guard agents and transaction-review receipts on 0G Mainnet.
- **0G Storage:** encrypted agent metadata and full review reports are uploaded from the browser through the 0G Storage SDK.
- **0G Compute:** transaction risk analysis uses the 0G Compute OpenAI-compatible endpoint. If no browser key is entered, the UI runs a local fallback only for development.
- **0G DA:** compact review evidence blobs are submitted through a configured DA gateway, or deterministically committed for submission through `npm run da:submit`.
- **Agent ID:** each guardian is linked to an Agent ID token id and Agent ID contract address for ownable AI identity.

## Architecture

```text
Browser + Wallet
  -> 0G Storage SDK: guardian metadata root, review report root
  -> 0G Compute: structured transaction-risk JSON
  -> 0G DA: review evidence commitment
  -> 0G Chain: GuardianRegistry + ProtectionReceipt
  -> ChainScan + StorageScan proof links
```

There is no app database, worker, or server wallet in the product path. Vercel serves the Next.js frontend. Deployment scripts are used only for contracts and optional DA evidence submission.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run test:contracts
npm run build
npm run dev
```

Open `http://localhost:3000`, connect a 0G Mainnet wallet, and run the review console.

## Contract Deployment

Compile and deploy:

```bash
DEPLOYER_PRIVATE_KEY=0x... npm run deploy:mainnet
```

The deployment script writes public values to `deployment.env`:

```text
NEXT_PUBLIC_GUARDIAN_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PROTECTION_RECEIPT_ADDRESS=0x...
GUARDIAN_REGISTRY_DEPLOY_TX=0x...
PROTECTION_RECEIPT_DEPLOY_TX=0x...
```

Set those values in Vercel before the final deployment.

## DA Submission

For a browser-accessible DA gateway, set:

```text
NEXT_PUBLIC_DA_GATEWAY_URL=https://...
```

If no gateway is available, save the evidence blob and run:

```bash
npm run da:submit -- ./review-evidence.json
```

The script prints the deterministic commitment to anchor in the receipt. For final judging, submit the same payload through a running 0G DA client.

## Judge Reproduction

1. Install dependencies with `npm install`.
2. Run `npm run test:contracts`.
3. Run `npm run build`.
4. Deploy contracts to 0G Mainnet with `npm run deploy:mainnet`.
5. Set public env vars from `deployment.env`.
6. Start the app and run one transaction review.
7. Verify ChainScan links, StorageScan roots, DA commitment, and Agent ID token id on the proof panel.

## Submission Fields

- Project name: **GuardianMesh**
- Description: GuardianMesh lets users create AI guard agents that privately review transactions, store audit memory on 0G, and anchor verifiable protection receipts on-chain.
- GitHub repository: `https://github.com/ts-mfon/guardianmesh`
- 0G mainnet contract: fill after deployment
- 0G Explorer: `https://chainscan.0g.ai/address/<contract>`
- Frontend demo: fill after Vercel deploy

## X Post Template

```text
Introducing GuardianMesh for the #0GHackathon.

GuardianMesh lets users create AI guard agents that privately review transactions, store audit memory on 0G, and anchor verifiable protection receipts on-chain.

Built with 0G Storage, 0G Compute, 0G Chain, 0G DA, and Agent ID.

#BuildOn0G
@0G_labs @0g_CN @0g_Eco @HackQuest_
```
