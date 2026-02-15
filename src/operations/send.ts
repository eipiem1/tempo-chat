import { getWalletClient, getPublicClient, validateAddress, resolveToken, parseAmount } from "../client.js";
import { getWallet } from "../wallet/manager.js";
import { resolveAddress } from "../wallet/resolve.js";
import { TOKEN_DECIMALS } from "../constants.js";
import type { Address } from "viem";

interface SendOptions {
  amount: string;
  token: string;
  to: string;
  memo?: string;
  privateKey?: string;
  walletAlias?: string;
}

function stringToHex(str: string): `0x${string}` {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hex = Buffer.from(data).toString("hex");
  return `0x${hex.padEnd(64, "0").slice(0, 64)}`;
}

export async function sendCommand(options: SendOptions): Promise<void> {
  const { amount, token, to: recipient, memo, privateKey, walletAlias } = options;
  
  let senderPrivateKey = privateKey;
  
  if (!senderPrivateKey && walletAlias) {
    if (validateAddress(walletAlias)) {
      const wallet = getWallet(walletAlias);
      if (!wallet) {
        throw new Error(`Wallet not found: ${walletAlias}`);
      }
      senderPrivateKey = wallet.privateKey;
    } else {
      const wallet = getWallet(walletAlias);
      if (!wallet) {
        throw new Error(`Wallet not found: ${walletAlias}`);
      }
      senderPrivateKey = wallet.privateKey;
    }
  }
  
  if (!senderPrivateKey) {
    throw new Error("No wallet specified. Use --private-key or --wallet");
  }
  
  let resolvedRecipient = recipient;
  
  if (!validateAddress(resolvedRecipient)) {
    console.log(`Resolving recipient: ${resolvedRecipient}...`);
    try {
      resolvedRecipient = await resolveAddress(resolvedRecipient);
      console.log(`  Resolved to: ${resolvedRecipient}`);
    } catch {
      throw new Error(`Could not resolve recipient: ${resolvedRecipient}`);
    }
  }
  
  const tokenAddress = resolveToken(token);
  const decimals = TOKEN_DECIMALS[tokenAddress];
  const amountParsed = parseAmount(amount, decimals);
  
  const walletClient = getWalletClient(senderPrivateKey);
  const publicClient = getPublicClient();
  
  console.log(`\nSending ${amount} ${token.toUpperCase()} to ${resolvedRecipient}`);
  if (memo) {
    console.log(`  Memo: ${memo}`);
  }
  console.log(`\nWaiting for confirmation...`);
  
  try {
    const { request } = await publicClient.simulateContract({
      address: tokenAddress,
      abi: [
        {
          name: "transfer",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
        {
          name: "transferWithMemo",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "memo", type: "bytes32" },
          ],
          outputs: [],
        },
      ] as const,
      functionName: memo ? "transferWithMemo" : "transfer",
      args: memo 
        ? [resolvedRecipient as Address, amountParsed, stringToHex(memo)]
        : [resolvedRecipient as Address, amountParsed],
    });
    
    const hash = await walletClient.writeContract(request);
    
    console.log(`\nTransaction submitted!`);
    console.log(`  Hash: ${hash}`);
    console.log(`  Explorer: https://explore.tempo.xyz/tx/${hash}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log(`\nTransaction confirmed!`);
    console.log(`  Block: ${receipt.blockNumber}`);
    console.log(`  Status: ${receipt.status === "success" ? "SUCCESS" : "FAILED"}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Transaction failed: ${error.message}`);
    }
    throw error;
  }
}

export async function sendToken(options: SendOptions): Promise<string> {
  const { amount, token, to: recipient, memo, privateKey, walletAlias } = options;
  
  let senderPrivateKey = privateKey;
  
  if (!senderPrivateKey && walletAlias) {
    if (validateAddress(walletAlias)) {
      const wallet = getWallet(walletAlias);
      if (!wallet) {
        throw new Error(`Wallet not found: ${walletAlias}`);
      }
      senderPrivateKey = wallet.privateKey;
    } else {
      const wallet = getWallet(walletAlias);
      if (!wallet) {
        throw new Error(`Wallet not found: ${walletAlias}`);
      }
      senderPrivateKey = wallet.privateKey;
    }
  }
  
  if (!senderPrivateKey) {
    throw new Error("No wallet specified");
  }
  
  const tokenAddress = resolveToken(token);
  const decimals = TOKEN_DECIMALS[tokenAddress];
  const amountParsed = parseAmount(amount, decimals);
  
  const walletClient = getWalletClient(senderPrivateKey);
  const publicClient = getPublicClient();
  
  let resolvedRecipient = recipient;
  if (!validateAddress(resolvedRecipient)) {
    resolvedRecipient = await resolveAddress(resolvedRecipient);
  }
  
  try {
    const { request } = await publicClient.simulateContract({
      address: tokenAddress,
      abi: [
        {
          name: "transfer",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ] as const,
      functionName: "transfer",
      args: [resolvedRecipient as Address, amountParsed],
    });
    
    const hash = await walletClient.writeContract(request);
    return hash;
  } catch (error) {
    throw new Error(`Send failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
