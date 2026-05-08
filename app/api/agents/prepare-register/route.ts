import { NextRequest, NextResponse } from "next/server";
import { Interface } from "ethers";
import { requireContractAddress } from "@/lib/config";
import { agentRegistryAbi, registerAgentSchema } from "@shared/index";

async function body(req: NextRequest) {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return req.json();
  const form = await req.formData();
  const raw = Object.fromEntries(form.entries());
  return {
    ...raw,
    capabilityTags: String(raw.capabilityTags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
    accessPolicy: Number(raw.accessPolicy ?? 0)
  };
}

export async function POST(req: NextRequest) {
  try {
    const input = registerAgentSchema.parse(await body(req));
    const iface = new Interface(agentRegistryAbi);
    return NextResponse.json({
      transaction: {
        to: requireContractAddress(),
        value: "0",
        data: iface.encodeFunctionData("registerAgent", [
          input.name,
          input.capabilityTags,
          input.capabilityMetadata,
          input.accessPolicy
        ])
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare registration" }, { status: 400 });
  }
}
