import { NextRequest, NextResponse } from "next/server";
import { getAgents } from "@/lib/live";

export async function GET(req: NextRequest) {
  try {
    const capability = req.nextUrl.searchParams.get("capability")?.toLowerCase();
    const agents = await getAgents();
    const filtered = capability
      ? agents.filter((agent) => agent.tags.some((tag) => tag.toLowerCase() === capability))
      : agents;
    return NextResponse.json({ agents: filtered });
  } catch (error) {
    return NextResponse.json({
      agents: [],
      error: error instanceof Error ? error.message : "Could not read agents"
    });
  }
}
