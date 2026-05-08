import { NextRequest, NextResponse } from "next/server";
import { ethers, Interface } from "ethers";
import { registry } from "@/lib/chain";
import { requireContractAddress } from "@/lib/config";
import { saveUpload } from "@/lib/db";
import { uploadJsonTo0G } from "@/lib/storage";
import { agentRegistryAbi, MemoryAccess, uploadMemorySchema } from "@shared/index";

async function parseBody(req: NextRequest) {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return req.json();
  const form = await req.formData();
  const raw = Object.fromEntries(form.entries());
  return { ...raw, memory: JSON.parse(String(raw.memory ?? "{}")) };
}

export async function POST(req: NextRequest) {
  try {
    const input = uploadMemorySchema.parse(await parseBody(req));
    const recovered = ethers.verifyMessage(input.message, input.signature);
    if (recovered.toLowerCase() !== input.agentAddress.toLowerCase()) {
      throw new Error("Signature does not match the agent address.");
    }
    if (!input.message.includes(`agent:${input.agentAddress.toLowerCase()}`)) {
      throw new Error("Authorization message must include the agent address.");
    }

    const contract = registry();
    const profile = await contract.getAgentProfile(input.agentAddress);
    if (profile.owner.toLowerCase() !== input.agentAddress.toLowerCase()) {
      throw new Error("Only the registered agent owner can upload memory.");
    }
    const encrypted = Number(profile.accessPolicy) !== MemoryAccess.PUBLIC;
    const upload = await uploadJsonTo0G(input.memory, encrypted);
    const iface = new Interface(agentRegistryAbi);
    const transaction = {
      to: requireContractAddress(),
      value: "0",
      data: iface.encodeFunctionData("updateMemory", [upload.rootHash])
    };
    await saveUpload({ agentAddress: input.agentAddress, ...upload });
    return NextResponse.json({ upload, transaction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Memory upload failed" }, { status: 400 });
  }
}
