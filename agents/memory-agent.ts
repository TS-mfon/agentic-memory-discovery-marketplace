import { Verdict } from "@shared/index";

const demo = {
  guardian: "DeFi Approval Sentinel",
  transaction: "Unlimited approval to unknown spender",
  result: {
    riskScore: 875,
    verdict: Verdict.BLOCK,
    detectedRisks: ["ERC20 approval call detected", "Unlimited allowance pattern detected"],
    recommendedAction: "Do not sign until the spender is independently verified."
  }
};

console.log(JSON.stringify(demo, null, 2));
