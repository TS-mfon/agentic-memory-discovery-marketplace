import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/chain";

export async function GET(req: NextRequest, { params }: { params: Promise<{ agentAddress: string }> }) {
  const { agentAddress } = await params;
  const reader = req.nextUrl.searchParams.get("reader") ?? "0x0000000000000000000000000000000000000000";
  const contract = registry();
  const canRead = await contract.canReadMemory(reader, agentAddress);
  const profile = await contract.getAgentProfile(agentAddress);
  const accessPolicy = Number(profile.accessPolicy ?? profile[8]);
  const memoryRootHash = String(profile.memoryRootHash ?? profile[3]);
  return NextResponse.json({
    canRead,
    encrypted: accessPolicy !== 0,
    memoryRootHash: canRead ? memoryRootHash : null,
    note: "Use the 0G Storage indexer to retrieve the blob by memoryRootHash. Encrypted blobs require server-side key material."
  });
}
