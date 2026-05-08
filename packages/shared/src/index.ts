import { z } from "zod";

export const ZERO_G_MAINNET = {
  chainId: 16661,
  rpcUrl: "https://evmrpc.0g.ai",
  storageIndexer: "https://indexer-storage-turbo.0g.ai",
  explorerUrl: "https://chainscan.0g.ai"
} as const;

export enum MemoryAccess {
  PUBLIC = 0,
  PRIVATE = 1,
  PERMISSIONED = 2
}

export const agentRegistryAbi = [
  "function registerAgent(string name,string[] capabilityTags,string capabilityMetadata,uint8 accessPolicy) returns (address)",
  "function updateMemory(bytes32 newMemoryRootHash)",
  "function updateCapabilities(string[] newTags,string newMetadata)",
  "function setAccessPolicy(uint8 newPolicy)",
  "function grantMemoryAccess(address grantee,uint256 durationSeconds)",
  "function revokeMemoryAccess(address grantee)",
  "function getAgentsByCapability(string tag) view returns (address[])",
  "function getAllAgents() view returns (address[])",
  "function getAgentProfile(address agentAddress) view returns ((string name,string[] capabilityTags,string capabilityMetadata,bytes32 memoryRootHash,address owner,uint256 registeredAt,uint256 lastMemoryUpdate,uint256 totalMemoryUpdates,uint8 accessPolicy))",
  "function canReadMemory(address reader,address agentAddress) view returns (bool)",
  "function getMemoryRootHash(address agentAddress) view returns (bytes32)",
  "event AgentRegistered(address indexed agentAddress,string name,string[] capabilityTags,uint256 timestamp)",
  "event MemoryUpdated(address indexed agentAddress,bytes32 oldHash,bytes32 newHash,uint256 timestamp)",
  "event CapabilitiesUpdated(address indexed agentAddress,string[] newTags,uint256 timestamp)",
  "event AccessPolicyUpdated(address indexed agentAddress,uint8 policy)",
  "event AccessGranted(address indexed agentAddress,address indexed grantee,uint256 expiresAt)",
  "event AccessRevoked(address indexed agentAddress,address indexed grantee)"
] as const;

export const memoryObjectSchema = z.object({
  version: z.literal("1.0"),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  timestamp: z.number().int().nonnegative(),
  snapshotId: z.string().min(1),
  context: z.object({
    conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
    taskLogs: z.array(z.record(z.string(), z.unknown())).default([]),
    learnedPreferences: z.record(z.string(), z.unknown()).default({})
  }),
  embeddings: z.object({
    memoryVectors: z.array(z.unknown()).default([]),
    embeddingModel: z.string().default("")
  }).default({ memoryVectors: [], embeddingModel: "" }),
  metadata: z.record(z.string(), z.unknown()).default({}),
  previousRootHash: z.string().default("0x0000000000000000000000000000000000000000000000000000000000000000")
});

export const registerAgentSchema = z.object({
  name: z.string().min(1).max(128),
  capabilityTags: z.array(z.string().min(1).max(64)).min(1).max(12),
  capabilityMetadata: z.string().min(1).max(512),
  accessPolicy: z.nativeEnum(MemoryAccess)
});

export const uploadMemorySchema = z.object({
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  message: z.string().min(1),
  signature: z.string().min(64),
  memory: memoryObjectSchema
});

export const grantAccessSchema = z.object({
  grantee: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  durationSeconds: z.coerce.number().int().nonnegative()
});

export type MemoryObject = z.infer<typeof memoryObjectSchema>;
