import "dotenv/config";
import OpenAI from "openai";
import type { ParsedOperation } from "../types.js";
import { listWallets } from "../wallet/manager.js";

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const MODEL = process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a command parser for Tempo blockchain CLI. Parse user requests into structured operations.

## CLI Commands

### Wallet Management:
- wallet_create: Create a new wallet (params: alias?, fund?)
- wallet_list: List all stored wallets (params: none)
- wallet_fund: Fund wallet from faucet (params: address)
- wallet_balance: Check wallet balance (params: address)

### Token Operations:
- send: Send tokens to recipient (params: amount, token, to, memo?)
- swap: Swap tokens on DEX (params: amountIn, tokenIn, tokenOut, slippageBps?)
- balance: Check wallet balance (params: address)
- portfolio: Get full portfolio (params: address)

### Natural Language Patterns:
- "list my wallets" or "show wallets" or "wallet list" -> wallet_list
- "create wallet" or "new wallet" -> wallet_create (with fund=true if wants funding)
- "fund wallet" or "add funds" -> wallet_fund
- "check balance" or "show balance" or "my balance" -> balance
- "send X token to Y" -> send
- "swap X token for Y" or "exchange X to Y" -> swap

## Available tokens on Tempo testnet:
- aUSD / AlphaUSD: 0x20c0000000000000000000000000000000000001
- bUSD / BetaUSD: 0x20c0000000000000000000000000000000000002
- tUSD / ThetaUSD: 0x20c0000000000000000000000000000000000003
- pathUSD: 0x20c0000000000000000000000000000000000000

## Resolving addresses:
- Addresses can be: wallet address (0x...), alias (stored in local wallets), email, or phone
- When user says "my wallet" or refers to their wallets, use wallet_list first

## Response format:
{
  "operation": "wallet_create|wallet_list|wallet_fund|wallet_balance|send|swap|balance|portfolio",
  "params": { /* operation-specific params */ },
  "confidence": 0.0-1.0,
  "needsConfirmation": boolean
}

## Rules:
- Always normalize token names to aUSD, bUSD, tUSD, pathUSD
- Extract amount as string (e.g., "100" not 100)
- For addresses, use as-is (alias/email/phone will be resolved later)
- Set confidence based on how clear the intent is
- Set needsConfirmation=true if any params are ambiguous`;

export async function parseNaturalLanguage(input: string): Promise<ParsedOperation> {
  if (!API_KEY) {
    throw new Error("LLM_API_KEY not configured. Set it in .env");
  }
  
  const wallets = listWallets();
  const walletContext = wallets.length > 0 
    ? `\nUser's stored wallets: ${wallets.map(w => `${w.alias}: ${w.address}`).join(", ")}`
    : "\nNo stored wallets yet.";
  
  const openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
  });
  
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input + walletContext },
    ],
    temperature: 0.1,
  });
  
  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("Empty response from LLM");
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse LLM response: ${content}`);
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]) as ParsedOperation;
    return parsed;
  } catch {
    throw new Error(`Failed to parse LLM response: ${content}`);
  }
}

export async function executeParsedOperation(
  operation: ParsedOperation,
  options: {
    privateKey?: string;
    walletAlias?: string;
  } = {}
): Promise<void> {
  const { operation: op, params } = operation;
  
  switch (op) {
    case "wallet_create": {
      const { createWallet } = await import("../wallet/create.js");
      await createWallet({
        alias: params.alias as string | undefined,
        fund: params.fund as boolean | undefined,
      });
      break;
    }
    
    case "wallet_list": {
      const { listWalletsCommand } = await import("../wallet/list.js");
      listWalletsCommand();
      break;
    }
    
    case "wallet_fund": {
      const { fundWallet } = await import("../wallet/fund.js");
      await fundWallet(params.address as string);
      console.log("Funding complete!");
      break;
    }
    
    case "wallet_balance":
    case "balance": {
      const { balanceCommand } = await import("../operations/balance.js");
      await balanceCommand(params.address as string);
      break;
    }
    
    case "send": {
      const { sendToken } = await import("../operations/send.js");
      const result = await sendToken({
        amount: params.amount as string,
        token: params.token as string,
        to: params.to as string,
        memo: params.memo as string | undefined,
        privateKey: options.privateKey,
        walletAlias: options.walletAlias,
      });
      console.log(`Send transaction: ${result}`);
      break;
    }
    
    case "swap": {
      const { swapCommand } = await import("../operations/swap.js");
      await swapCommand({
        amountIn: params.amountIn as string,
        tokenIn: params.tokenIn as string,
        tokenOut: params.tokenOut as string,
        slippageBps: params.slippageBps as number | undefined,
        privateKey: options.privateKey,
        walletAlias: options.walletAlias,
      });
      break;
    }
    
    case "portfolio": {
      const { balanceCommand } = await import("../operations/balance.js");
      await balanceCommand(params.address as string);
      break;
    }
    
    default:
      throw new Error(`Unknown operation: ${op}`);
  }
}
