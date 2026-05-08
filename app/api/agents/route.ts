import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/chain";

export async function GET(req: NextRequest) {
  const capability = req.nextUrl.searchParams.get("capability");
  const contract = registry();
  const addresses: string[] = capability ? await contract.getAgentsByCapability(capability) : await contract.getAllAgents();
  const agents = await Promise.all(
    addresses.map(async (address) => {
      const profile = await contract.getAgentProfile(address);
      return {
        address,
        name: profile.name,
        capabilityTags: profile.capabilityTags,
        capabilityMetadata: profile.capabilityMetadata,
        memoryRootHash: profile.memoryRootHash,
        owner: profile.owner,
        registeredAt: profile.registeredAt.toString(),
        lastMemoryUpdate: profile.lastMemoryUpdate.toString(),
        totalMemoryUpdates: profile.totalMemoryUpdates.toString(),
        accessPolicy: Number(profile.accessPolicy)
      };
    })
  );
  return NextResponse.json({ agents });
}
