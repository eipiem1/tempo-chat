import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Wallet, WalletStore } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WALLET_FILE = join(__dirname, "..", "..", "wallets.json");

export function getWalletStore(): WalletStore {
  if (!existsSync(WALLET_FILE)) {
    return { wallets: [] };
  }
  
  try {
    const data = readFileSync(WALLET_FILE, "utf-8");
    return JSON.parse(data) as WalletStore;
  } catch {
    return { wallets: [] };
  }
}

export function saveWalletStore(store: WalletStore): void {
  writeFileSync(WALLET_FILE, JSON.stringify(store, null, 2));
}

export function addWallet(wallet: Wallet): void {
  const store = getWalletStore();
  
  const existing = store.wallets.find(w => w.alias === wallet.alias);
  if (existing) {
    throw new Error(`Wallet with alias "${wallet.alias}" already exists`);
  }
  
  store.wallets.push(wallet);
  saveWalletStore(store);
}

export function getWallet(alias: string): Wallet | null {
  const store = getWalletStore();
  return store.wallets.find(
    w => w.alias.toLowerCase() === alias.toLowerCase() ||
         w.address.toLowerCase() === alias.toLowerCase()
  ) || null;
}

export function listWallets(): Wallet[] {
  return getWalletStore().wallets;
}

export function removeWallet(alias: string): boolean {
  const store = getWalletStore();
  const index = store.wallets.findIndex(
    w => w.alias.toLowerCase() === alias.toLowerCase()
  );
  
  if (index === -1) {
    return false;
  }
  
  store.wallets.splice(index, 1);
  saveWalletStore(store);
  return true;
}
