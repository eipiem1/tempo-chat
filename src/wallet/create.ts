import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { addWallet, getWallet } from "./manager.js";
import { fundWallet } from "./fund.js";
import type { Wallet } from "../types.js";

export interface CreateWalletOptions {
  alias?: string;
  fund?: boolean;
}

export async function createWallet(options: CreateWalletOptions = {}): Promise<Wallet> {
  const { alias, fund = false } = options;
  
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  const walletAlias = alias || `wallet-${Date.now()}`;
  
  const existing = getWallet(walletAlias);
  if (existing) {
    throw new Error(`Wallet with alias "${walletAlias}" already exists`);
  }
  
  const wallet: Wallet = {
    alias: walletAlias,
    address: account.address,
    privateKey: privateKey,
    createdAt: Date.now(),
  };
  
  addWallet(wallet);
  
  console.log(`\nWallet created successfully!`);
  console.log(`  Alias: ${wallet.alias}`);
  console.log(`  Address: ${wallet.address}`);
  
  if (fund) {
    console.log(`\nFunding wallet from faucet...`);
    try {
      await fundWallet(wallet.address);
      console.log(`  Wallet funded successfully!`);
    } catch (error) {
      console.error(`  Failed to fund wallet:`, error instanceof Error ? error.message : error);
    }
  }
  
  return wallet;
}
