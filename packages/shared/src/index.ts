import { z } from "zod";

export const ZERO_G_MAINNET = {
  chainId: 16661,
  chainIdHex: "0x4115",
  rpcUrl: "https://evmrpc.0g.ai",
  storageIndexer: "https://indexer-storage-turbo.0g.ai",
  explorerUrl: "https://chainscan.0g.ai",
  storageScanUrl: "https://storagescan.0g.ai"
} as const;

export enum Verdict {
  UNKNOWN = 0,
  ALLOW = 1,
  WARN = 2,
  BLOCK = 3
}

export const guardianRegistryAbi = [
  "function registerGuardian(uint256 agentTokenId,bytes32 metadataRoot,bytes32 capabilityHash,string name,string[] tags)",
  "function updateGuardianMetadata(uint256 agentTokenId,bytes32 newMetadataRoot)",
  "function setGuardianActive(uint256 agentTokenId,bool active)",
  "function getGuardian(uint256 agentTokenId) view returns (address owner,uint256 agentTokenId,bytes32 metadataRoot,bytes32 capabilityHash,string name,string[] tags,bool active,uint256 registeredAt,uint256 updatedAt)",
  "function getGuardiansByOwner(address owner) view returns (uint256[])",
  "function getGuardiansByTag(string tag) view returns (uint256[])",
  "function getAllGuardians() view returns (uint256[])",
  "event GuardianRegistered(uint256 indexed agentTokenId,address indexed owner,bytes32 metadataRoot,bytes32 capabilityHash,string name)",
  "event GuardianMetadataUpdated(uint256 indexed agentTokenId,bytes32 previousRoot,bytes32 newRoot)",
  "event GuardianStatusChanged(uint256 indexed agentTokenId,bool active)"
] as const;

export const protectionReceiptAbi = [
  "function recordReview(uint256 agentTokenId,bytes32 txIntentHash,bytes32 reportRoot,bytes32 daCommitment,bytes32 computeHash,uint16 riskScore,uint8 verdict) returns (bytes32)",
  "function updateDACommitment(bytes32 reviewId,bytes32 daCommitment)",
  "function getReview(bytes32 reviewId) view returns (bytes32 reviewId,address user,uint256 agentTokenId,bytes32 txIntentHash,bytes32 reportRoot,bytes32 daCommitment,bytes32 computeHash,uint16 riskScore,uint8 verdict,uint256 recordedAt)",
  "function getReviewsByUser(address user) view returns (bytes32[])",
  "function getReviewsByAgent(uint256 agentTokenId) view returns (bytes32[])",
  "function getAllReviewIds() view returns (bytes32[])",
  "event ReviewRecorded(bytes32 indexed reviewId,address indexed user,uint256 indexed agentTokenId,bytes32 txIntentHash,bytes32 reportRoot,bytes32 daCommitment,bytes32 computeHash,uint16 riskScore,uint8 verdict)",
  "event ReviewDAUpdated(bytes32 indexed reviewId,bytes32 previousCommitment,bytes32 newCommitment)"
] as const;

export const agenticIdAbi = [
  "function mint(address to,string encryptedURI,bytes32 metadataHash) returns (uint256)",
  "function authorizeUsage(uint256 tokenId,address executor,bytes permissions)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)"
] as const;

export const guardianProfileSchema = z.object({
  version: z.literal("1.0"),
  name: z.string().min(1).max(128),
  owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentTokenId: z.string().min(1),
  tags: z.array(z.string().min(1).max(64)).min(1).max(12),
  systemPrompt: z.string().min(1).max(4000),
  policy: z.object({
    blockUnlimitedApprovals: z.boolean(),
    blockUnknownSpenders: z.boolean(),
    maxNativeValue: z.string(),
    requireHumanConfirmationAboveRisk: z.number().int().min(0).max(1000)
  }),
  createdAt: z.string()
});

export const txIntentSchema = z.object({
  chainId: z.number().int().positive(),
  target: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.string().default("0"),
  calldata: z.string().regex(/^0x[a-fA-F0-9]*$/),
  protocol: z.string().max(80).default("unknown"),
  notes: z.string().max(1000).default("")
});

export const computeReviewSchema = z.object({
  riskScore: z.number().int().min(0).max(1000),
  verdict: z.nativeEnum(Verdict),
  detectedRisks: z.array(z.string()).default([]),
  recommendedAction: z.string().min(1),
  plainEnglishSummary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  model: z.string().min(1),
  provider: z.string().min(1)
});

export const reviewReportSchema = z.object({
  version: z.literal("1.0"),
  reviewId: z.string(),
  user: z.string(),
  agentTokenId: z.string(),
  txIntentHash: z.string(),
  computeHash: z.string(),
  storageRoot: z.string().optional(),
  daCommitment: z.string().optional(),
  txIntent: txIntentSchema,
  computeReview: computeReviewSchema,
  createdAt: z.string()
});

export type GuardianProfile = z.infer<typeof guardianProfileSchema>;
export type TxIntent = z.infer<typeof txIntentSchema>;
export type ComputeReview = z.infer<typeof computeReviewSchema>;
export type ReviewReport = z.infer<typeof reviewReportSchema>;
