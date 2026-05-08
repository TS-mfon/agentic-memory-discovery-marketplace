import { ethers } from "ethers";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

export function hashJson(value: unknown): string {
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalJson(value)));
}

export function shortHash(value: string, size = 10) {
  if (!value) return "not set";
  return `${value.slice(0, size)}...${value.slice(-6)}`;
}
