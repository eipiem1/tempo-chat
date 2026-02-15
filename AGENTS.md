# Agent Guidelines for Tempo CLI

This document provides guidelines for agents working on this codebase.

## Project Overview

This is a CLI tool for Tempo blockchain operations. It supports wallet management, token transfers, swaps, and natural language command parsing.

## Tech Stack

- **Language**: TypeScript (ESM)
- **Package Manager**: pnpm
- **Runtime**: Node.js 18+
- **Dependencies**:
  - `viem` - Ethereum interactions
  - `commander` - CLI argument parsing
  - `openai` - LLM integration
  - `@privy-io/node` - Privy for email/phone resolution
  - `dotenv` - Environment config
  - `tsx` - TypeScript execution

## Commands

### Running the CLI

```bash
npx tsx src/index.ts <command>  # Direct command mode
npx tsx src/index.ts             # Interactive agentic mode (no args)
```

### Available Commands

| Command | Description |
|---------|-------------|
| `wallet create [--fund] [--alias <name>]` | Create new wallet, optionally fund from faucet |
| `wallet list` | List all stored wallets |
| `wallet fund <address>` | Fund wallet from faucet |
| `wallet balance <address>` | Check wallet balance |
| `send <amount> <token> <recipient> [-m <memo>] [-w <wallet>]` | Send tokens |
| `swap <amount> <tokenIn> <tokenOut> [-s <slippage>] [-w <wallet>]` | Swap on DEX |
| `balance [address]` | Check balance |

### Interactive Mode

When run without arguments, enters agentic loop:
```
npx tsx src/index.ts
```

The user enters natural language prompts, which are parsed via LLM into commands to execute.

## Configuration

Create a `.env` file:

```bash
# Tempo RPC (optional, defaults to testnet)
TEMPO_RPC_URL=https://rpc.moderato.tempo.xyz

# Privy Configuration (for resolving email/phone to wallet address)
PRIVY_APP_ID=
PRIVY_APP_SECRET=

# LLM Configuration (for natural language parsing)
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Always define explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/aliases
- Prefer `unknown` over `any`

### Imports

- Use `.js` extension for local imports (ESM)
- Group: external first, then internal

```typescript
import { Command } from "commander";
import "dotenv/config";
import { getWallet } from "./wallet/manager.js";
```

### Naming Conventions

- **Files**: kebab-case (`wallet-manager.ts`)
- **Components/Classes**: PascalCase
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE

### Error Handling

```typescript
try {
  // operation
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Failed: ${message}`);
  throw error;
}
```

## Project Structure

```
src/
├── index.ts           # CLI entry point (commander + agentic loop)
├── client.ts          # Viem client setup
├── constants.ts       # Token addresses, chain config
├── types.ts           # TypeScript types
├── wallet/
│   ├── manager.ts     # Wallet storage
│   ├── create.ts     # Create wallet
│   ├── list.ts       # List wallets
│   ├── fund.ts       # Faucet integration
│   └── resolve.ts    # Privy resolution
├── operations/
│   ├── balance.ts    # Check balance
│   ├── send.ts       # Send tokens
│   └── swap.ts       # Swap tokens
└── llm/
    └── parser.ts     # LLM parsing
```

## Tempo Testnet

- **RPC**: https://rpc.moderato.tempo.xyz
- **Chain ID**: 42431
- **Explorer**: https://explore.tempo.xyz

### Testnet Tokens

| Token | Address |
|-------|---------|
| pathUSD | `0x20c0000000000000000000000000000000000000` |
| AlphaUSD | `0x20c0000000000000000000000000000000000001` |
| BetaUSD | `0x20c0000000000000000000000000000000000002` |
| ThetaUSD | `0x20c0000000000000000000000000000000000003` |

## Address Resolution

All commands support multiple address formats:
- Wallet address: `0xABC...`
- Stored wallet alias: `my-wallet`
- Email: `user@example.com` (via Privy)
- Phone: `+1234567890` (via Privy)

Resolution order: direct address → local alias → Privy lookup

## Best Practices

- Always validate addresses before use
- Use BigInt for token amounts (never floating point)
- Handle loading and error states for blockchain operations
- Log transaction hashes for debugging
- Use `walletAlias` option for convenience
