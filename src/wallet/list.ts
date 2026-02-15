import { listWallets } from "./manager.js";
import type { Wallet } from "../types.js";

export function listWalletsCommand(): void {
  const wallets = listWallets();
  
  if (wallets.length === 0) {
    console.log("No wallets found. Create one with: tempo-cli wallet create");
    return;
  }
  
  console.log(`\nStored wallets (${wallets.length}):\n`);
  
  wallets.forEach((wallet: Wallet) => {
    console.log(`  ${wallet.alias}:`);
    console.log(`    Address: ${wallet.address}`);
    console.log(`    Created: ${new Date(wallet.createdAt).toISOString()}`);
    console.log();
  });
}
