import { PrivyClient } from "@privy-io/node";
import { getWallet } from "./manager.js";
import { validateAddress } from "../client.js";
import type { Address } from "viem";

let privy: PrivyClient | null = null;

function getPrivy(): PrivyClient {
  if (!privy) {
    const appId = process.env.PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    
    if (!appId || !appSecret) {
      throw new Error("PRIVY_APP_ID and PRIVY_APP_SECRET must be set");
    }
    
    privy = new PrivyClient({
      appId,
      appSecret,
    });
  }
  return privy;
}

export async function resolveAddress(identifier: string): Promise<Address> {
  if (validateAddress(identifier)) {
    return identifier as Address;
  }
  
  const wallet = getWallet(identifier);
  if (wallet) {
    return wallet.address;
  }
  
  const privy = getPrivy();
  
  console.log(`Resolving via Privy: ${identifier}`);
  
  try {
    if (identifier.includes("@")) {
      const user = await privy.users().getByEmailAddress({ address: identifier });
      const walletAccount = user.linked_accounts?.find(
        (account) => account.type === "wallet" && account.chain_type === "ethereum"
      );
      
      if (walletAccount?.address) {
        console.log(`Resolved email ${identifier} to ${walletAccount.address}`);
        return walletAccount.address as Address;
      }
    } else if (identifier.startsWith("+")) {
      const user = await privy.users().getByPhoneNumber({ number: identifier });
      const walletAccount = user.linked_accounts?.find(
        (account) => account.type === "wallet" && account.chain_type === "ethereum"
      );
      
      if (walletAccount?.address) {
        console.log(`Resolved phone ${identifier} to ${walletAccount.address}`);
        return walletAccount.address as Address;
      }
    }
  } catch (error) {
    console.error(`Failed to resolve ${identifier} via Privy:`, error);
  }
  
  throw new Error(`Could not resolve address: ${identifier}`);
}

export function isPrivyConfigured(): boolean {
  return !!(process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET);
}
