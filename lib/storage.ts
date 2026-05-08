import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ethers } from "ethers";
import { config } from "./config";

export interface StorageUploadResult {
  rootHash: string;
  txHash?: string;
  sizeBytes: number;
  encrypted: boolean;
}

function encryptionKey() {
  if (!config.memoryEncryptionKey) throw new Error("MEMORY_ENCRYPTION_KEY is required for encrypted memory.");
  return createHash("sha256").update(config.memoryEncryptionKey).digest();
}

export function encryptJson(payload: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload, null, 2));
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted: true, iv: iv.toString("hex"), tag: tag.toString("hex"), data: encrypted.toString("hex") };
}

export function decryptJson(payload: { iv: string; tag: string; data: string }) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(payload.iv, "hex"));
  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(payload.data, "hex")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

export async function uploadJsonTo0G(payload: unknown, encrypted = false): Promise<StorageUploadResult> {
  if (!config.serverPrivateKey) throw new Error("SERVER_WALLET_PRIVATE_KEY is required for 0G Storage uploads.");
  const body = encrypted ? encryptJson(payload) : payload;
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
  const signer = new ethers.Wallet(config.serverPrivateKey, provider);
  const balance = await provider.getBalance(signer.address);
  if (balance === 0n) throw new Error(`0G Storage signer ${signer.address} has no 0G balance.`);

  const encoded = new TextEncoder().encode(JSON.stringify(body, null, 2));
  const sdk = (await import("@0gfoundation/0g-storage-ts-sdk")) as any;
  const memData = new sdk.MemData(encoded);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`0G merkle tree error: ${treeErr}`);
  const indexer = new sdk.Indexer(config.storageIndexer);
  const [tx, uploadErr] = await indexer.upload(memData, config.rpcUrl, signer);
  if (uploadErr !== null) throw new Error(`0G upload error: ${uploadErr}`);
  const rootHash = tx?.rootHash ?? tree?.rootHash?.();
  if (!rootHash) throw new Error("0G upload completed without a root hash.");
  return { rootHash: String(rootHash), txHash: tx?.txHash ? String(tx.txHash) : undefined, sizeBytes: encoded.byteLength, encrypted };
}
