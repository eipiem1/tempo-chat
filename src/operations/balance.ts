import { getPublicClient, validateAddress, formatAmount } from "../client.js";
import { TOKENS, TOKEN_DECIMALS, TOKEN_SYMBOLS } from "../constants.js";
import type { Address } from "viem";

export async function balanceCommand(address: string): Promise<void> {
  if (!validateAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  
  const client = getPublicClient();
  const addr = address as Address;
  
  console.log(`\nFetching balances for: ${addr}\n`);
  
  const tokenList = Object.entries(TOKENS) as [string, Address][];
  
  for (const [symbol, tokenAddress] of tokenList) {
    try {
      const balance = (await client.readContract({
        address: tokenAddress,
        abi: [
          {
            name: "balanceOf",
            type: "function",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
        ] as const,
        functionName: "balanceOf",
        args: [addr],
      })) as bigint;
      
      const decimals = TOKEN_DECIMALS[tokenAddress];
      const formatted = formatAmount(balance, decimals);
      
      console.log(`  ${TOKEN_SYMBOLS[tokenAddress]}: ${formatted}`);
    } catch (error) {
      console.log(`  ${TOKEN_SYMBOLS[tokenAddress]}: Error fetching balance`);
    }
  }
}

export async function getBalance(address: Address): Promise<Record<string, string>> {
  const client = getPublicClient();
  
  const balances: Record<string, string> = {};
  
  for (const [symbol, tokenAddress] of Object.entries(TOKENS)) {
    try {
      const balance = (await client.readContract({
        address: tokenAddress,
        abi: [
          {
            name: "balanceOf",
            type: "function",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
        ] as const,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;
      
      const decimals = TOKEN_DECIMALS[tokenAddress];
      balances[symbol] = formatAmount(balance, decimals);
    } catch {
      balances[symbol] = "0";
    }
  }
  
  return balances;
}
