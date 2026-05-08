import { ComputeReview, TxIntent, Verdict, computeReviewSchema } from "@shared/index";

export interface ComputeInput {
  baseUrl: string;
  apiKey: string;
  model: string;
  guardianName: string;
  policy: string;
  txIntent: TxIntent;
}

export async function reviewTransactionWith0GCompute(input: ComputeInput): Promise<ComputeReview> {
  if (!input.apiKey.trim()) {
    return localHeuristicReview(input);
  }

  const response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: input.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a 0G GuardianMesh transaction firewall. Return only JSON with riskScore 0-1000, verdict 1 allow 2 warn 3 block, detectedRisks array, recommendedAction, plainEnglishSummary, confidence 0-1, model, provider."
        },
        {
          role: "user",
          content: JSON.stringify({
            guardianName: input.guardianName,
            policy: input.policy,
            txIntent: input.txIntent
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`0G Compute request failed: ${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (!content) throw new Error("0G Compute returned no message content.");
  const parsed = JSON.parse(content);
  return computeReviewSchema.parse({
    ...parsed,
    model: parsed.model || input.model,
    provider: parsed.provider || "0G Compute Router"
  });
}

function localHeuristicReview(input: ComputeInput): ComputeReview {
  const risks: string[] = [];
  let score = 180;
  const calldata = input.txIntent.calldata.toLowerCase();
  if (calldata.includes("095ea7b3")) {
    score += 280;
    risks.push("ERC20 approval call detected.");
  }
  if (calldata.includes("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
    score += 380;
    risks.push("Unlimited allowance pattern detected.");
  }
  if (input.txIntent.value !== "0") {
    score += 120;
    risks.push("Native token value is attached to the call.");
  }
  if (input.txIntent.notes.toLowerCase().includes("unknown")) {
    score += 90;
    risks.push("User notes mention an unknown counterparty.");
  }
  const riskScore = Math.min(score, 1000);
  const verdict = riskScore >= 760 ? Verdict.BLOCK : riskScore >= 420 ? Verdict.WARN : Verdict.ALLOW;
  return {
    riskScore,
    verdict,
    detectedRisks: risks.length ? risks : ["No high-risk signature was detected by the local fallback."],
    recommendedAction:
      verdict === Verdict.BLOCK
        ? "Do not sign until the target contract and allowance are independently verified."
        : verdict === Verdict.WARN
          ? "Proceed only after confirming spender, calldata, and value."
          : "Proceed if the displayed target and calldata match your intent.",
    plainEnglishSummary:
      "Local fallback review completed. Add a 0G Compute API key in the UI to run decentralized inference for final judging.",
    confidence: input.apiKey ? 0.85 : 0.55,
    model: input.model,
    provider: input.apiKey ? "0G Compute" : "Local fallback"
  };
}
