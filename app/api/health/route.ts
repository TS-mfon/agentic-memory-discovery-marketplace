import { NextResponse } from "next/server";
import { Wallet } from "ethers";
import { assertMainnet, provider } from "@/lib/chain";
import { config } from "@/lib/config";
import { getLastBlock } from "@/lib/db";

export async function GET() {
  try {
    await assertMainnet();
    const rpc = provider();
    const latestBlock = await rpc.getBlockNumber();
    const signer = config.serverPrivateKey ? new Wallet(config.serverPrivateKey, rpc) : undefined;
    const signerBalance = signer ? (await rpc.getBalance(signer.address)).toString() : "0";
    return NextResponse.json({
      ok: true,
      service: "agentic-memory-discovery-marketplace",
      chainId: config.chainId,
      latestBlock,
      lastIndexedBlock: await getLastBlock(),
      contractConfigured: Boolean(config.contractAddress),
      storageIndexer: config.storageIndexer,
      signerAddress: signer?.address ?? null,
      signerBalance,
      encryptionConfigured: Boolean(config.memoryEncryptionKey)
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Health check failed" }, { status: 500 });
  }
}
