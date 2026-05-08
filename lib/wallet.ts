import { BrowserProvider, Contract, ethers } from "ethers";
import { agenticIdAbi, guardianRegistryAbi, protectionReceiptAbi } from "@shared/index";
import { clientConfig } from "./config";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

export async function getBrowserProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Install a wallet that supports custom EVM networks.");
  }
  return new BrowserProvider(window.ethereum);
}

export async function connectWallet() {
  const provider = await getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  await ensureZeroGNetwork(provider);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export async function ensureZeroGNetwork(provider: BrowserProvider) {
  const network = await provider.getNetwork();
  if (Number(network.chainId) === clientConfig.chainId) return;
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: clientConfig.chainIdHex }]);
  } catch {
    await provider.send("wallet_addEthereumChain", [
      {
        chainId: clientConfig.chainIdHex,
        chainName: "0G Mainnet",
        nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
        rpcUrls: [clientConfig.rpcUrl],
        blockExplorerUrls: [clientConfig.explorerUrl]
      }
    ]);
  }
}

export async function guardianRegistryContract() {
  const { signer } = await connectWallet();
  return new Contract(clientConfig.guardianRegistryAddress, guardianRegistryAbi, signer);
}

export async function protectionReceiptContract() {
  const { signer } = await connectWallet();
  return new Contract(clientConfig.protectionReceiptAddress, protectionReceiptAbi, signer);
}

export async function agentIdContract() {
  const { signer } = await connectWallet();
  return new Contract(clientConfig.agentIdContractAddress, agenticIdAbi, signer);
}
