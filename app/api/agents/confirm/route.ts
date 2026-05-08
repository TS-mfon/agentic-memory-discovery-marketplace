import { NextRequest, NextResponse } from "next/server";
import { provider, registryInterface } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { txHash } = await req.json();
    if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash))) throw new Error("txHash must be a transaction hash.");
    const receipt = await provider().getTransactionReceipt(txHash);
    if (!receipt) throw new Error("Transaction receipt was not found.");
    const parsed = receipt.logs
      .map((log) => {
        try {
          return registryInterface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "AgentRegistered");
    if (!parsed) throw new Error("AgentRegistered event was not found in receipt.");
    return NextResponse.json({
      agentAddress: parsed.args.agentAddress,
      name: parsed.args.name,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not confirm agent" }, { status: 400 });
  }
}
