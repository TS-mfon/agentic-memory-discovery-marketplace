import { clientConfig } from "./config";

export interface ClientStorageResult {
  rootHash: string;
  txHash?: string;
  sizeBytes: number;
}

export async function uploadJsonTo0GFromBrowser(payload: unknown, signer: unknown): Promise<ClientStorageResult> {
  const sdk = (await import("@0gfoundation/0g-storage-ts-sdk")) as any;
  const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  const memData = new sdk.MemData(encoded);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`0G Storage Merkle error: ${treeErr}`);
  const indexer = new sdk.Indexer(clientConfig.storageIndexer);
  const [tx, uploadErr] = await indexer.upload(memData, clientConfig.rpcUrl, signer);
  if (uploadErr !== null) throw new Error(`0G Storage upload error: ${uploadErr}`);
  const rootHash = tx?.rootHash ?? tree?.rootHash?.();
  if (!rootHash) throw new Error("0G Storage upload completed without a root hash.");
  return { rootHash: String(rootHash), txHash: tx?.txHash ? String(tx.txHash) : undefined, sizeBytes: encoded.byteLength };
}
