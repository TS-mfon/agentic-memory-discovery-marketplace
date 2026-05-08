import { clientConfig } from "./config";

export function txLink(txHash: string) {
  return `${clientConfig.explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

export function addressLink(address: string) {
  return `${clientConfig.explorerUrl.replace(/\/$/, "")}/address/${address}`;
}

export function storageLink(rootHash: string) {
  return `${clientConfig.storageScanUrl.replace(/\/$/, "")}/?root=${rootHash}`;
}
