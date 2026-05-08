import { NextRequest, NextResponse } from "next/server";
import { provider, registryInterface } from "@/lib/chain";
import { config, requireContractAddress } from "@/lib/config";
import { getLastBlock, saveEvents, setLastBlock } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    if (config.adminSecret && req.headers.get("x-admin-secret") !== config.adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rpc = provider();
    const fromBlock = Math.max(await getLastBlock(), config.deploymentBlock);
    const toBlock = await rpc.getBlockNumber();
    const logs = await rpc.getLogs({ address: requireContractAddress(), fromBlock, toBlock });
    const events = logs.flatMap((log) => {
      try {
        const parsed = registryInterface.parseLog(log);
        if (!parsed) return [];
        return [{
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          logIndex: log.index,
          eventName: parsed.name,
          args: Object.fromEntries(parsed.fragment.inputs.map((input, index) => [input.name, parsed.args[index]?.toString?.() ?? parsed.args[index]]))
        }];
      } catch {
        return [];
      }
    });
    await saveEvents(events);
    await setLastBlock(toBlock + 1);
    return NextResponse.json({ synced: events.length, fromBlock, toBlock });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sync failed" }, { status: 500 });
  }
}
