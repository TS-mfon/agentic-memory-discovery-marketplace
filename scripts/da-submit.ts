import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";

const payloadPath = process.argv[2];
if (!payloadPath) {
  throw new Error("Usage: npm run da:submit -- ./review-evidence.json");
}
if (!existsSync(payloadPath)) {
  throw new Error(`Payload not found: ${payloadPath}`);
}

const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
const canonical = JSON.stringify(payload, Object.keys(payload).sort(), 2);
const commitment = ethers.keccak256(ethers.toUtf8Bytes(canonical));

console.log(JSON.stringify({
  commitment,
  note: "Deterministic local DA evidence commitment. Submit this payload through a running 0G DA client for final DA proof.",
  payloadPath
}, null, 2));
