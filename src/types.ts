import { Address } from "viem";

export interface Wallet {
  alias: string;
  address: Address;
  privateKey: string;
  createdAt: number;
}

export interface WalletStore {
  wallets: Wallet[];
}

export interface TokenBalance {
  symbol: string;
  address: Address;
  balance: string;
  decimals: number;
}

export interface Portfolio {
  address: Address;
  balances: TokenBalance[];
  totalUSDValue?: string;
}

export interface SendParams {
  to: string;
  amount: string;
  token: Address;
  memo?: string;
}

export interface SwapParams {
  amountIn: string;
  tokenIn: Address;
  tokenOut: Address;
  slippageBps?: number;
}

export interface ParsedOperation {
  operation: "send" | "swap" | "balance" | "portfolio";
  params: Record<string, unknown>;
  confidence: number;
  rawInput: string;
}

export type TokenSymbol = keyof typeof import("./constants").TOKENS;
