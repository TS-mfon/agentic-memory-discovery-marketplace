import { NextRequest, NextResponse } from "next/server";
import { Interface } from "ethers";
import { requireContractAddress } from "@/lib/config";
import { agentRegistryAbi, grantAccessSchema } from "@shared/index";

export async function POST(req: NextRequest) {
  try {
    const input = grantAccessSchema.parse(await req.json());
    const iface = new Interface(agentRegistryAbi);
    return NextResponse.json({
      transaction: {
        to: requireContractAddress(),
        value: "0",
        data: iface.encodeFunctionData("grantMemoryAccess", [input.grantee, input.durationSeconds])
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare grant" }, { status: 400 });
  }
}
