import { createPublicClient, createWalletClient, http, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { TEMPO_MODERATO, TOKENS } from "./constants.js";
import type { Address } from "viem";

let publicClient: ReturnType<typeof createPublicClient> | null = null;
let walletClient: ReturnType<typeof createWalletClient> | null = null;
let account: ReturnType<typeof privateKeyToAccount> | null = null;

export function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: TEMPO_MODERATO,
      transport: http(process.env.TEMPO_RPC_URL || "https://rpc.moderato.tempo.xyz"),
    });
  }
  return publicClient;
}

export function getWalletClient(privateKey: string) {
  const acc = privateKeyToAccount(privateKey as `0x${string}`);
  
  const client = createWalletClient({
    account: acc,
    chain: TEMPO_MODERATO,
    transport: http(process.env.TEMPO_RPC_URL || "https://rpc.moderato.tempo.xyz"),
  });
  
  return client;
}

export function getAccount(privateKey: string) {
  return privateKeyToAccount(privateKey as `0x${string}`);
}

export function validateAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function resolveToken(token: string): Address {
  const normalized = token.toLowerCase().replace("-", "");
  
  const tokenMap: Record<string, Address> = {
    "ausd": TOKENS.alphaUsd,
    "alphausd": TOKENS.alphaUsd,
    "busd": TOKENS.betaUsd,
    "betausd": TOKENS.betaUsd,
    "tusd": TOKENS.thetaUsd,
    "thetausd": TOKENS.thetaUsd,
    "pathusd": TOKENS.pathUSD,
    "0x20c0000000000000000000000000000000000000": TOKENS.pathUSD,
    "0x20c0000000000000000000000000000000000001": TOKENS.alphaUsd,
    "0x20c0000000000000000000000000000000000002": TOKENS.betaUsd,
    "0x20c0000000000000000000000000000000000003": TOKENS.thetaUsd,
  };
  
  const resolved = tokenMap[normalized];
  if (!resolved) {
    throw new Error(`Unknown token: ${token}. Supported: aUSD, bUSD, tUSD, pathUSD`);
  }
  
  return resolved;
}

export function parseAmount(amount: string, decimals: number): bigint {
  const cleaned = amount.replace(/[,$]/g, "");
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  const parts = cleaned.split(".");
  if (parts.length === 2 && parts[1].length > decimals) {
    throw new Error(`Amount has too many decimal places. Max ${decimals}`);
  }
  
  return BigInt(Math.round(parsed * Math.pow(10, decimals)));
}

export function formatAmount(balance: bigint, decimals: number): string {
  const str = balance.toString().padStart(decimals, "0");
  const intPart = str.slice(0, -decimals) || "0";
  const fracPart = str.slice(-decimals).replace(/0+$/, "");
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

export { TEMPO_MODERATO, TOKENS };
