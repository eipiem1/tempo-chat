import "dotenv/config";
import { getWalletClient, getPublicClient, resolveToken, parseAmount } from "../client.js";
import { getWallet } from "../wallet/manager.js";
import { TOKEN_DECIMALS } from "../constants.js";
import { Abis, Addresses } from "viem/tempo";
import type { Address } from "viem";

const STABLECOIN_DEX = Addresses.stablecoinDex;

interface SwapOptions {
  amountIn: string;
  tokenIn: string;
  tokenOut: string;
  slippageBps?: number;
  privateKey?: string;
  walletAlias?: string;
}

function formatUnits(value: bigint, decimals: number): string {
  const str = value.toString().padStart(decimals, "0");
  const intPart = str.slice(0, -decimals) || "0";
  const fracPart = str.slice(-decimals).replace(/0+$/, "");
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

export async function swapCommand(options: SwapOptions): Promise<void> {
  const { amountIn, tokenIn, tokenOut, slippageBps = 50, privateKey, walletAlias } = options;
  
  let senderPrivateKey = privateKey;
  
  if (!senderPrivateKey && walletAlias) {
    const wallet = getWallet(walletAlias);
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletAlias}`);
    }
    senderPrivateKey = wallet.privateKey;
  }
  
  if (!senderPrivateKey) {
    throw new Error("No wallet specified. Use --private-key or --wallet");
  }
  
  const tokenInAddress = resolveToken(tokenIn);
  const tokenOutAddress = resolveToken(tokenOut);
  
  const decimals = TOKEN_DECIMALS[tokenInAddress];
  const amountParsed = parseAmount(amountIn, decimals);
  
  const walletClient = getWalletClient(senderPrivateKey);
  const publicClient = getPublicClient();
  
  console.log(`\nFetching swap quote...`);
  
  try {
    const quote = (await publicClient.readContract({
      address: STABLECOIN_DEX,
      abi: Abis.stablecoinDex,
      functionName: "quoteSwapExactAmountIn",
      args: [tokenInAddress, tokenOutAddress, amountParsed],
    })) as bigint;
    
    const slippageMultiplier = BigInt(10000 - slippageBps) / 10000n;
    const minAmountOut = quote * slippageMultiplier;
    
    console.log(`\nSwap quote:`);
    console.log(`  Input: ${amountIn} ${tokenIn.toUpperCase()}`);
    console.log(`  Output: ${formatUnits(quote, decimals)} ${tokenOut.toUpperCase()}`);
    console.log(`  Min output (${slippageBps / 100}% slippage): ${formatUnits(minAmountOut, decimals)} ${tokenOut.toUpperCase()}`);
    console.log(`\nWaiting for confirmation...`);
    
    const { request: approveRequest } = await publicClient.simulateContract({
      address: tokenInAddress,
      abi: Abis.tip20,
      functionName: "approve",
      args: [STABLECOIN_DEX, amountParsed],
    });
    
    const approveHash = await walletClient.writeContract(approveRequest);
    console.log(`\nApproval submitted: ${approveHash}`);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log(`  Approved!`);
    
    const { request: swapRequest } = await publicClient.simulateContract({
      address: STABLECOIN_DEX,
      abi: Abis.stablecoinDex,
      functionName: "swapExactAmountIn",
      args: [tokenInAddress, tokenOutAddress, amountParsed, minAmountOut],
    });
    
    const swapHash = await walletClient.writeContract(swapRequest);
    
    console.log(`\nTransaction submitted!`);
    console.log(`  Hash: ${swapHash}`);
    console.log(`  Explorer: https://explore.tempo.xyz/tx/${swapHash}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });
    
    console.log(`\nTransaction confirmed!`);
    console.log(`  Block: ${receipt.blockNumber}`);
    console.log(`  Status: ${receipt.status === "success" ? "SUCCESS" : "FAILED"}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Swap failed: ${error.message}`);
    }
    throw error;
  }
}
