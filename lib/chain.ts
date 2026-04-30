import { Contract, ethers, Interface } from "ethers";
import { agentRegistryAbi } from "@shared/index";
import { config, requireContractAddress } from "./config";

export function provider() {
  return new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
}

export function registry(readonly = true) {
  const runner = readonly ? provider() : new ethers.Wallet(config.serverPrivateKey, provider());
  return new Contract(requireContractAddress(), agentRegistryAbi, runner);
}

export const registryInterface = new Interface(agentRegistryAbi);

export async function assertMainnet() {
  const network = await provider().getNetwork();
  if (Number(network.chainId) !== 16661) {
    throw new Error(`Configured RPC is chain ${network.chainId}; expected 0G Mainnet chain 16661.`);
  }
}
