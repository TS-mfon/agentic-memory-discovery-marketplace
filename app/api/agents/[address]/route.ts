import { NextResponse } from "next/server";
import { registry } from "@/lib/chain";

export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const profile = await registry().getAgentProfile(address);
  return NextResponse.json({
    agent: {
      address,
      name: String(profile.name ?? profile[0]),
      capabilityTags: Array.from((profile.capabilityTags ?? profile[1] ?? []) as Iterable<unknown>).map(String),
      capabilityMetadata: String(profile.capabilityMetadata ?? profile[2]),
      memoryRootHash: String(profile.memoryRootHash ?? profile[3]),
      owner: String(profile.owner ?? profile[4]),
      registeredAt: (profile.registeredAt ?? profile[5]).toString(),
      lastMemoryUpdate: (profile.lastMemoryUpdate ?? profile[6]).toString(),
      totalMemoryUpdates: (profile.totalMemoryUpdates ?? profile[7]).toString(),
      accessPolicy: Number(profile.accessPolicy ?? profile[8])
    }
  });
}
