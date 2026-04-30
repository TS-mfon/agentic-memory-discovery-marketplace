import { NextResponse } from "next/server";
import { registry } from "@/lib/chain";

export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const profile = await registry().getAgentProfile(address);
  return NextResponse.json({
    agent: {
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
    }
  });
}
