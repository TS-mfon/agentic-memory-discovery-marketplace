import { clientConfig } from "./config";
import { hashJson } from "./hash";

export interface DAResult {
  commitment: string;
  mode: "gateway" | "fallback";
  note: string;
}

export async function submitReviewBlobToDA(blob: unknown): Promise<DAResult> {
  if (!clientConfig.daGatewayUrl) {
    return {
      commitment: hashJson(blob),
      mode: "fallback",
      note: "No browser-accessible DA gateway is configured. This commitment is deterministic and can be submitted with npm run da:submit."
    };
  }

  const response = await fetch(clientConfig.daGatewayUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(blob)
  });
  if (!response.ok) throw new Error(`0G DA gateway failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  const commitment = body.commitment || body.blobHash || body.hash || body.txHash;
  if (!commitment) throw new Error("0G DA gateway did not return a commitment.");
  return { commitment: String(commitment), mode: "gateway", note: "Submitted to configured 0G DA gateway." };
}
