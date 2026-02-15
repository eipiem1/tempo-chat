# Tempo CLI

Natural language CLI for Tempo blockchain operations.

## Features

- **Wallet Management** - Create, list, fund, and check balances
- **Token Transfers** - Send tokens (pathUSD, AlphaUSD, BetaUSD, ThetaUSD)
- **Token Swaps** - Swap tokens on DEX with configurable slippage
- **Natural Language Interface** - AI-powered command parsing in interactive mode
- **Address Resolution** - Support for addresses, aliases, emails, and phone numbers

## Installation

```bash
pnpm install
```

## Configuration

Create a `.env` file:

```bash
# Tempo RPC (optional, defaults to testnet)
TEMPO_RPC_URL=https://rpc.moderato.tempo.xyz

# Wallet (one of these required)
# Option 1: Private key (hex string with 0x prefix)
TEMPO_PRIVATE_KEY=

# Option 2: Use wallet from wallets.json (specify alias)
# WALLET_ALIAS=

# Privy Configuration (for resolving email/phone to wallet address)
PRIVY_APP_ID=
PRIVY_APP_SECRET=

# LLM Configuration (for natural language parsing via OpenAI compatible API)
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

## Usage

### Interactive Mode (Natural Language)

```bash
npx tsx src/index.ts
```

Enter natural language commands like:
- "list my wallets"
- "create wallet"
- "check balance"
- "send 10 aUSD to 0xABC..."

### Direct Commands

```bash
# Wallet operations
npx tsx src/index.ts wallet create [--fund] [--alias <name>]
npx tsx src/index.ts wallet list
npx tsx src/index.ts wallet fund <address>
npx tsx src/index.ts wallet balance <address>

# Token operations
npx tsx src/index.ts send <amount> <token> <recipient> [-m <memo>] [-w <wallet>]
npx tsx src/index.ts swap <amount> <tokenIn> <tokenOut> [-s <slippage>] [-w <wallet>]
npx tsx src/index.ts balance [address]
```

### Address Formats

All commands support multiple address formats:
- Wallet address: `0xABC...`
- Stored wallet alias: `my-wallet`
- Email: `user@example.com` (via Privy)
- Phone: `+1234567890` (via Privy)

## Tempo Testnet

- **RPC**: https://rpc.moderato.tempo.xyz
- **Chain ID**: 42431
- **Explorer**: https://explore.tempo.xyz

### Testnet Tokens

| Token | Symbol | Address |
|-------|--------|---------|
| pathUSD | pathUSD | `0x20c0000000000000000000000000000000000000` |
| AlphaUSD | aUSD | `0x20c0000000000000000000000000000000000001` |
| BetaUSD | bUSD | `0x20c0000000000000000000000000000000000002` |
| ThetaUSD | tUSD | `0x20c0000000000000000000000000000000000003` |

## Project Structure

```
src/
├── index.ts           # CLI entry point (commander + agentic loop)
├── client.ts          # Viem client setup
├── constants.ts       # Token addresses, chain config
├── types.ts           # TypeScript types
├── wallet/
│   ├── manager.ts     # Wallet storage
│   ├── create.ts      # Create wallet
│   ├── list.ts        # List wallets
│   ├── fund.ts        # Faucet integration
│   └── resolve.ts     # Privy resolution
├── operations/
│   ├── balance.ts     # Check balance
│   ├── send.ts        # Send tokens
│   └── swap.ts        # Swap tokens
└── llm/
    └── parser.ts      # LLM parsing
```

## Tech Stack

- **Language**: TypeScript (ESM)
- **Package Manager**: pnpm
- **Runtime**: Node.js 18+
- **Blockchain**: viem + Tempo + Privy
- **CLI**: commander
- **AI**: OpenAI compatible API
